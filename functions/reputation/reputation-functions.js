const {
    onDocumentCreated,
    onDocumentDeleted,
    onDocumentWritten
} = require("firebase-functions/v2/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { admin, db } = require("../config/firebase");
const {
    applyContributionEvent,
    calculateContributionStats,
    calculateReputation,
    deriveRecognition,
    getReputationLevel,
    REPUTATION_POINTS
} = require("./reputation-policy");

const FieldValue = admin.firestore.FieldValue;

function safeId(value) {
    return String(value || "event")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 240);
}

function dateKey(timestamp) {
    const date = timestamp?.toDate?.() || new Date();
    return date.toISOString().slice(0, 10);
}

async function recordReputationEvent({
    actorId,
    communityId,
    displayName,
    eventId,
    metadata = {},
    points,
    reason,
    signalActive,
    signalId,
    signalOccurredAt,
    sourceId,
    sourceType,
    type,
    userId
}) {
    if (!communityId || !eventId || !userId || !Number.isFinite(Number(points)))
        return false;
    const eventRef = db
        .collection("communities")
        .doc(communityId)
        .collection("reputationEvents")
        .doc(safeId(eventId));
    const summaryRef = db
        .collection("communities")
        .doc(communityId)
        .collection("reputation")
        .doc(userId);
    const signalRef = signalId
        ? db
              .collection("communities")
              .doc(communityId)
              .collection("reputationSignals")
              .doc(safeId(signalId))
        : null;

    return db.runTransaction(async (transaction) => {
        const [eventSnapshot, summarySnapshot, signalSnapshot] =
            await Promise.all([
                transaction.get(eventRef),
                transaction.get(summaryRef),
                signalRef ? transaction.get(signalRef) : Promise.resolve(null)
            ]);
        if (eventSnapshot.exists) return false;

        let appliedPoints = Number(points);
        let signalUpdate = null;
        if (signalRef) {
            const previous = signalSnapshot?.exists
                ? signalSnapshot.data()
                : null;
            const occurredAtMillis = new Date(
                signalOccurredAt || Date.now()
            ).getTime();
            if (
                previous &&
                Number(previous.lastEventMillis || 0) >= occurredAtMillis
            ) {
                return false;
            }
            const wasActive = Boolean(previous?.active);
            signalUpdate = {
                active: Boolean(signalActive),
                lastEventMillis: occurredAtMillis,
                sourceId,
                updatedAt: FieldValue.serverTimestamp(),
                userId
            };
            if (wasActive === Boolean(signalActive)) {
                transaction.set(signalRef, signalUpdate, { merge: true });
                return false;
            }
            appliedPoints = signalActive
                ? Math.abs(Number(points))
                : -Math.abs(Number(points));
        }

        const current = summarySnapshot.exists
            ? Number(summarySnapshot.data().points || 0)
            : 0;
        // Keep signed deltas commutative because Firestore triggers can arrive
        // out of order. Clients clamp transient negative values for display,
        // and a full ledger recalculation produces the same final total.
        const next = current + appliedPoints;
        let contributionStats;
        if (summarySnapshot.data()?.contributionStats) {
            contributionStats = applyContributionEvent(
                summarySnapshot.data().contributionStats,
                type
            );
        } else {
            const history = await transaction.get(
                db
                    .collection("communities")
                    .doc(communityId)
                    .collection("reputationEvents")
                    .where("userId", "==", userId)
            );
            contributionStats = calculateContributionStats([
                ...history.docs.map((item) => item.data()),
                { type }
            ]);
        }
        const recognition = deriveRecognition(next, contributionStats);
        const timestamp = FieldValue.serverTimestamp();
        if (signalRef) {
            transaction.set(signalRef, signalUpdate, { merge: true });
        }
        transaction.create(eventRef, {
            actorId: actorId || null,
            communityId,
            displayName: displayName || "Student",
            metadata,
            occurredAt: timestamp,
            points: appliedPoints,
            reason,
            sourceId,
            sourceType,
            type,
            userId
        });
        transaction.set(
            summaryRef,
            {
                displayName: displayName || "Student",
                activeMember: true,
                badgeProgress: recognition.badgeProgress,
                badges: recognition.badges,
                capabilities: recognition.capabilities,
                contributionStats,
                eventCount: FieldValue.increment(1),
                lastEventAt: timestamp,
                level: getReputationLevel(next),
                points: next,
                trustLevel: recognition.trustLevel,
                trustRank: recognition.trustRank,
                updatedAt: timestamp,
                userId
            },
            { merge: true }
        );
        return true;
    });
}

async function recordParticipationDay(event, answer) {
    if (!answer?.authorId) return;
    const { communityId, questionId, answerId } = event.params;
    const currentAnswer = await db
        .collection("communities")
        .doc(communityId)
        .collection("questions")
        .doc(questionId)
        .collection("answers")
        .doc(answerId)
        .get();
    // A create trigger may arrive after a moderator has already removed the
    // answer. In that case there is no constructive activity left to reward.
    if (!currentAnswer.exists) return;
    await recordReputationEvent({
        actorId: answer.authorId,
        communityId,
        displayName: answer.authorName,
        eventId: `constructive_${answer.authorId}_${dateKey(answer.createdAt)}`,
        points: REPUTATION_POINTS.CONSTRUCTIVE_DAY,
        reason: "Constructive participation on a new study day",
        sourceId: `${questionId}/${answerId}`,
        sourceType: "answer",
        type: "constructive_day",
        userId: answer.authorId
    });
}

async function reverseParticipationDay(event, answer) {
    if (!answer?.authorId) return;
    const { communityId, questionId, answerId } = event.params;
    const sourceId = `${questionId}/${answerId}`;
    const originalRef = db
        .collection("communities")
        .doc(communityId)
        .collection("reputationEvents")
        .doc(
            safeId(
                `constructive_${answer.authorId}_${dateKey(answer.createdAt)}`
            )
        );
    const original = await originalRef.get();
    if (!original.exists || original.data().sourceId !== sourceId) return;
    await recordReputationEvent({
        actorId: null,
        communityId,
        displayName: answer.authorName,
        eventId: `constructive_removed_${event.id}`,
        points: -REPUTATION_POINTS.CONSTRUCTIVE_DAY,
        reason: "Constructive participation source was removed",
        sourceId,
        sourceType: "answer",
        type: "constructive_day_reversed",
        userId: answer.authorId
    });
}

exports.onAnswerReputationChanged = onDocumentWritten(
    "communities/{communityId}/questions/{questionId}/answers/{answerId}",
    async (event) => {
        const before = event.data?.before?.exists
            ? event.data.before.data()
            : null;
        const after = event.data?.after?.exists
            ? event.data.after.data()
            : null;
        const answer = after || before;
        if (!answer) return;
        const { communityId, questionId, answerId } = event.params;
        const sourceId = `${questionId}/${answerId}`;

        if (!before && after) await recordParticipationDay(event, after);
        if (before && !after) {
            // Delete any vote/comment descendants left by a direct client or
            // moderator delete. Vote deletion triggers append their reversals.
            await db.recursiveDelete(event.data.before.ref);
            await reverseParticipationDay(event, before);
        }

        const wasAccepted = Boolean(before?.accepted);
        const isAccepted = Boolean(after?.accepted);
        if (wasAccepted === isAccepted) return;
        if (answer.authorId === answer.questionAuthorId) return;

        await recordReputationEvent({
            actorId: answer.questionAuthorId,
            communityId,
            displayName: answer.authorName,
            eventId: `${isAccepted ? "accepted" : "accepted_reversed"}_${event.id}`,
            points: isAccepted
                ? REPUTATION_POINTS.ACCEPTED_ANSWER
                : -REPUTATION_POINTS.ACCEPTED_ANSWER,
            reason: isAccepted
                ? "Answer accepted by the question author"
                : "Accepted answer was changed or removed",
            sourceId,
            sourceType: "answer",
            signalActive: isAccepted,
            signalId: `accepted_${sourceId}`,
            signalOccurredAt: event.time,
            type: isAccepted ? "accepted_answer" : "accepted_answer_reversed",
            userId: answer.authorId
        });
    }
);

function voteEventHandler({ points, sourceType }) {
    return async (event, direction) => {
        const vote = event.data?.data();
        if (!vote?.recipientId || vote.userId === vote.recipientId) return;
        const { communityId, questionId, answerId, voteId } = event.params;
        const sourceId =
            sourceType === "answer" ? `${questionId}/${answerId}` : questionId;
        const positive = direction === "created";
        await recordReputationEvent({
            actorId: vote.userId,
            communityId,
            displayName: vote.recipientName,
            eventId: `${sourceType}_vote_${positive ? "added" : "removed"}_${event.id}`,
            points: positive ? points : -points,
            reason: positive
                ? `${sourceType === "answer" ? "Answer" : "Question"} marked useful`
                : `${sourceType === "answer" ? "Answer" : "Question"} upvote removed`,
            sourceId,
            sourceType,
            signalActive: positive,
            signalId: `${sourceType}_${sourceId}_${voteId}`,
            signalOccurredAt: event.time,
            type: positive
                ? `${sourceType}_upvote`
                : `${sourceType}_upvote_reversed`,
            userId: vote.recipientId
        });
    };
}

const answerVote = voteEventHandler({
    points: REPUTATION_POINTS.ANSWER_UPVOTE,
    sourceType: "answer"
});
const questionVote = voteEventHandler({
    points: REPUTATION_POINTS.HELPFUL_QUESTION,
    sourceType: "question"
});

exports.onAnswerUpvoteCreated = onDocumentCreated(
    "communities/{communityId}/questions/{questionId}/answers/{answerId}/upvotes/{voteId}",
    (event) => answerVote(event, "created")
);
exports.onAnswerUpvoteDeleted = onDocumentDeleted(
    "communities/{communityId}/questions/{questionId}/answers/{answerId}/upvotes/{voteId}",
    (event) => answerVote(event, "deleted")
);
exports.onQuestionUpvoteCreated = onDocumentCreated(
    "communities/{communityId}/questions/{questionId}/upvotes/{voteId}",
    (event) => questionVote(event, "created")
);
exports.onQuestionUpvoteDeleted = onDocumentDeleted(
    "communities/{communityId}/questions/{questionId}/upvotes/{voteId}",
    (event) => questionVote(event, "deleted")
);

function resourceEventHandler(direction) {
    return async (event) => {
        const resource = event.data?.data();
        if (!resource?.uploadedBy) return;
        const { communityId, channelId, fileId } = event.params;
        const active = direction === "created";
        const sourceId = `${channelId}/${fileId}`;
        await recordReputationEvent({
            actorId: resource.uploadedBy,
            communityId,
            displayName: resource.uploadedByName,
            eventId: `resource_${active ? "added" : "removed"}_${event.id}`,
            points: 0,
            reason: active
                ? "Study resource contributed to the community"
                : "Contributed resource was removed",
            signalActive: active,
            signalId: `resource_${sourceId}`,
            signalOccurredAt: event.time,
            sourceId,
            sourceType: "resource",
            type: active
                ? "resource_contributed"
                : "resource_contribution_reversed",
            userId: resource.uploadedBy
        });
    };
}

exports.onCommunityResourceCreated = onDocumentCreated(
    "communities/{communityId}/channels/{channelId}/files/{fileId}",
    resourceEventHandler("created")
);
exports.onCommunityResourceDeleted = onDocumentDeleted(
    "communities/{communityId}/channels/{channelId}/files/{fileId}",
    resourceEventHandler("deleted")
);

exports.onCommunityMemberChanged = onDocumentWritten(
    "communities/{communityId}/members/{userId}",
    async (event) => {
        const activeMember = Boolean(event.data?.after?.exists);
        const summaryRef = db
            .collection("communities")
            .doc(event.params.communityId)
            .collection("reputation")
            .doc(event.params.userId);
        const summary = await summaryRef.get();
        if (!summary.exists) return;
        await summaryRef.set(
            {
                activeMember,
                updatedAt: FieldValue.serverTimestamp()
            },
            { merge: true }
        );
    }
);

exports.onQuestionDeleted = onDocumentDeleted(
    "communities/{communityId}/questions/{questionId}",
    async (event) => {
        // Firestore does not cascade subcollections. Cleaning the deleted
        // question path also emits answer/vote deletions, which reverse any
        // reputation previously earned from the removed contribution.
        const flags = await db
            .collection("communities")
            .doc(event.params.communityId)
            .collection("curationFlags")
            .where("questionId", "==", event.params.questionId)
            .get();
        await Promise.all([
            db.recursiveDelete(event.data.ref),
            ...flags.docs.map((flag) => flag.ref.delete())
        ]);
    }
);

exports.onKnowledgeCollectionDeleted = onDocumentDeleted(
    "communities/{communityId}/knowledgeCollections/{collectionId}",
    async (event) => {
        await db.recursiveDelete(event.data.ref);
    }
);

exports.onCommunityDeleted = onDocumentDeleted(
    "communities/{communityId}",
    async (event) => {
        const communityRef = db
            .collection("communities")
            .doc(event.params.communityId);
        await Promise.all([
            db.recursiveDelete(communityRef.collection("curationFlags")),
            db.recursiveDelete(communityRef.collection("knowledgeCollections")),
            db.recursiveDelete(communityRef.collection("reputationEvents")),
            db.recursiveDelete(communityRef.collection("reputationSignals")),
            db.recursiveDelete(communityRef.collection("reputation")),
            db.recursiveDelete(communityRef.collection("topicTags"))
        ]);
    }
);

async function recalculateCommunityReputation(communityId) {
    const communityRef = db.collection("communities").doc(communityId);
    const events = await communityRef.collection("reputationEvents").get();
    const totals = new Map();
    events.forEach((eventDocument) => {
        const event = eventDocument.data();
        if (!event.userId) return;
        const current = totals.get(event.userId) || {
            displayName: event.displayName || "Student",
            events: []
        };
        current.displayName = event.displayName || current.displayName;
        current.events.push(event);
        totals.set(event.userId, current);
    });

    const entries = [...totals.entries()];
    const memberships = await Promise.all(
        entries.map(([userId]) =>
            communityRef.collection("members").doc(userId).get()
        )
    );
    const batch = db.batch();
    entries.forEach(([userId, value], index) => {
        const points = calculateReputation(value.events);
        const contributionStats = calculateContributionStats(value.events);
        const recognition = deriveRecognition(points, contributionStats);
        batch.set(
            communityRef.collection("reputation").doc(userId),
            {
                displayName: value.displayName,
                activeMember: memberships[index].exists,
                badgeProgress: recognition.badgeProgress,
                badges: recognition.badges,
                capabilities: recognition.capabilities,
                contributionStats,
                eventCount: value.events.length,
                level: getReputationLevel(points),
                points,
                recalculatedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                userId,
                trustLevel: recognition.trustLevel,
                trustRank: recognition.trustRank
            },
            { merge: true }
        );
    });
    await batch.commit();
    return { eventCount: events.size, userCount: totals.size };
}

exports.recalculateCommunityReputation = onCall(async (request) => {
    if (!request.auth)
        throw new HttpsError("unauthenticated", "Sign in first.");
    const communityId = String(request.data?.communityId || "").trim();
    if (!communityId) {
        throw new HttpsError("invalid-argument", "A community ID is required.");
    }
    const membership = await db
        .collection("communities")
        .doc(communityId)
        .collection("members")
        .doc(request.auth.uid)
        .get();
    if (
        !membership.exists ||
        !["owner", "admin"].includes(membership.data().role)
    ) {
        throw new HttpsError(
            "permission-denied",
            "Only community owners and admins can recalculate reputation."
        );
    }
    return recalculateCommunityReputation(communityId);
});

exports.recordReputationEvent = recordReputationEvent;
exports.recalculateCommunityReputationData = recalculateCommunityReputation;
