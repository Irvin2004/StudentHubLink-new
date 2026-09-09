export const REPUTATION_LEVELS = Object.freeze([
    Object.freeze({ label: "Expert", minimum: 200 }),
    Object.freeze({ label: "Helper", minimum: 75 }),
    Object.freeze({ label: "Contributor", minimum: 25 }),
    Object.freeze({ label: "Newcomer", minimum: 0 })
]);

export const COMMUNITY_BADGES = Object.freeze([
    Object.freeze({
        description: "Receive an upvote on an answer.",
        id: "first_helpful_answer",
        label: "First Helpful Answer",
        metric: "answerUpvotes",
        target: 1
    }),
    Object.freeze({
        description: "Have ten answers accepted by question authors.",
        id: "accepted_answers_10",
        label: "10 Accepted Answers",
        metric: "acceptedAnswers",
        target: 10
    }),
    Object.freeze({
        description: "Earn fifty upvotes across your answers.",
        id: "answer_upvotes_50",
        label: "50 Upvotes",
        metric: "answerUpvotes",
        target: 50
    }),
    Object.freeze({
        description: "Share a study resource with the community.",
        id: "resource_contributor",
        label: "Resource Contributor",
        metric: "resourceContributions",
        target: 1
    }),
    Object.freeze({
        description: "Contribute constructive answers on seven study days.",
        id: "consistent_helper",
        label: "Consistent Helper",
        metric: "constructiveDays",
        target: 7
    })
]);

export const TRUST_CAPABILITIES = Object.freeze({
    ACCESS_CURATION_TOOLS: "access_curation_tools",
    CREATE_TOPIC_TAGS: "create_topic_tags",
    FLAG_DUPLICATE_QUESTIONS: "flag_duplicate_questions"
});

export const TRUST_LEVELS = Object.freeze([
    Object.freeze({ label: "Community Curator", rank: 3 }),
    Object.freeze({ label: "Community Guide", rank: 2 }),
    Object.freeze({ label: "Trusted Contributor", rank: 1 }),
    Object.freeze({ label: "Community Member", rank: 0 })
]);

const EMPTY_STATS = Object.freeze({
    acceptedAnswers: 0,
    answerUpvotes: 0,
    constructiveDays: 0,
    helpfulQuestions: 0,
    resourceContributions: 0
});

function normalizeStats(stats = {}) {
    return Object.fromEntries(
        Object.keys(EMPTY_STATS).map((metric) => [
            metric,
            Math.max(0, Number(stats[metric]) || 0)
        ])
    );
}

function normalizeBadgeProgress(progress, stats) {
    const byId = new Map(
        (Array.isArray(progress) ? progress : []).map((item) => [item.id, item])
    );
    return COMMUNITY_BADGES.map((badge) => {
        const stored = byId.get(badge.id);
        const current = Math.min(
            badge.target,
            Math.max(0, Number(stored?.current ?? stats[badge.metric]) || 0)
        );
        return Object.freeze({
            ...badge,
            current,
            earned: stored?.earned === true || current >= badge.target
        });
    });
}

export function getReputationLevel(points = 0) {
    const score = Math.max(0, Number(points) || 0);
    return REPUTATION_LEVELS.find((level) => score >= level.minimum).label;
}

export function createCommunityReputation(data = {}) {
    const points = Math.max(0, Number(data.points) || 0);
    const contributionStats = normalizeStats(data.contributionStats);
    const badgeProgress = normalizeBadgeProgress(
        data.badgeProgress,
        contributionStats
    );
    const trustRank = Math.max(0, Math.min(3, Number(data.trustRank) || 0));
    const trust = TRUST_LEVELS.find((item) => item.rank === trustRank);
    return Object.freeze({
        userId: String(data.userId || ""),
        displayName: String(data.displayName || "Student").trim() || "Student",
        points,
        level: getReputationLevel(points),
        badges: Object.freeze(
            badgeProgress
                .filter((badge) => badge.earned)
                .map((badge) => badge.id)
        ),
        badgeProgress: Object.freeze(badgeProgress),
        capabilities: Object.freeze(
            Array.isArray(data.capabilities)
                ? data.capabilities.filter((capability) =>
                      Object.values(TRUST_CAPABILITIES).includes(capability)
                  )
                : []
        ),
        contributionStats: Object.freeze(contributionStats),
        eventCount: Math.max(0, Number(data.eventCount) || 0),
        trustLevel: String(data.trustLevel || trust.label),
        trustRank,
        updatedAt: data.updatedAt ?? null
    });
}

export function hasTrustCapability(reputation, capability) {
    return Boolean(reputation?.capabilities?.includes(capability));
}

export function getCommunityBadgeLabel(badgeId) {
    return COMMUNITY_BADGES.find((badge) => badge.id === badgeId)?.label || "";
}
