import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

import { db } from "../../../firebase/index.js";
import {
    answerFromSnapshot,
    commentFromSnapshot,
    QUESTION_STATUS,
    questionFromSnapshot,
    validateAnswerContent,
    validateCommentContent,
    validateQuestionInput
} from "../models/community-question.js";

const PAGE_LIMIT = 100;

function actorData(actor) {
    if (!actor?.id)
        throw new TypeError("An authenticated student is required.");
    return {
        authorId: actor.id,
        authorName: String(actor.displayName || "Student")
            .trim()
            .slice(0, 120)
    };
}

function questionCollection(communityId) {
    if (!communityId) throw new TypeError("A community ID is required.");
    return collection(db, "communities", communityId, "questions");
}

function questionReference(communityId, questionId) {
    return doc(db, "communities", communityId, "questions", questionId);
}

function answerCollection(communityId, questionId) {
    return collection(questionReference(communityId, questionId), "answers");
}

function answerReference(communityId, questionId, answerId) {
    return doc(answerCollection(communityId, questionId), answerId);
}

export function subscribeToQuestions(communityId, onData, onError) {
    const questionsQuery = query(
        questionCollection(communityId),
        orderBy("updatedAt", "desc"),
        limit(PAGE_LIMIT)
    );
    return onSnapshot(
        questionsQuery,
        (snapshot) => onData(snapshot.docs.map(questionFromSnapshot)),
        onError
    );
}

export async function createQuestion(communityId, actor, input) {
    const validated = validateQuestionInput(input);
    const reference = doc(questionCollection(communityId));
    const timestamp = serverTimestamp();
    const data = {
        ...validated,
        ...actorData(actor),
        acceptedAnswerId: null,
        answerCount: 0,
        upvoteCount: 0,
        status: QUESTION_STATUS.UNANSWERED,
        createdAt: timestamp,
        updatedAt: timestamp
    };
    await setDoc(reference, data);
    return { id: reference.id, ...data };
}

export function updateQuestion(communityId, questionId, input) {
    return updateDoc(questionReference(communityId, questionId), {
        ...validateQuestionInput(input),
        updatedAt: serverTimestamp()
    });
}

export function subscribeToAnswers(communityId, questionId, onData, onError) {
    const answersQuery = query(
        answerCollection(communityId, questionId),
        orderBy("createdAt", "asc"),
        limit(PAGE_LIMIT)
    );
    return onSnapshot(
        answersQuery,
        (snapshot) => onData(snapshot.docs.map(answerFromSnapshot)),
        onError
    );
}

export async function createAnswer(communityId, questionId, actor, content) {
    const questionRef = questionReference(communityId, questionId);
    const answerRef = doc(answerCollection(communityId, questionId));
    const timestamp = serverTimestamp();
    await runTransaction(db, async (transaction) => {
        const questionSnapshot = await transaction.get(questionRef);
        if (!questionSnapshot.exists()) throw new Error("Question not found.");
        const question = questionSnapshot.data();
        transaction.set(answerRef, {
            ...actorData(actor),
            questionAuthorId: question.authorId,
            content: validateAnswerContent(content),
            accepted: false,
            upvoteCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        transaction.update(questionRef, {
            answerCount: Number(question.answerCount || 0) + 1,
            status:
                question.status === QUESTION_STATUS.SOLVED
                    ? QUESTION_STATUS.SOLVED
                    : QUESTION_STATUS.ANSWERED,
            updatedAt: timestamp
        });
    });
    return answerRef.id;
}

export function updateAnswer(communityId, questionId, answerId, content) {
    return updateDoc(answerReference(communityId, questionId, answerId), {
        content: validateAnswerContent(content),
        updatedAt: serverTimestamp()
    });
}

export async function deleteAnswer(communityId, questionId, answerId) {
    const questionRef = questionReference(communityId, questionId);
    const answerRef = answerReference(communityId, questionId, answerId);
    const cleanupBatch = writeBatch(db);
    await Promise.all([
        deleteNestedDocuments(collection(answerRef, "comments"), cleanupBatch),
        deleteNestedDocuments(collection(answerRef, "upvotes"), cleanupBatch)
    ]);
    await cleanupBatch.commit();
    await runTransaction(db, async (transaction) => {
        const [questionSnapshot, answerSnapshot] = await Promise.all([
            transaction.get(questionRef),
            transaction.get(answerRef)
        ]);
        if (!answerSnapshot.exists()) return;
        const question = questionSnapshot.data();
        const nextCount = Math.max(0, Number(question.answerCount || 0) - 1);
        transaction.delete(answerRef);
        transaction.update(questionRef, {
            acceptedAnswerId:
                question.acceptedAnswerId === answerId
                    ? null
                    : question.acceptedAnswerId || null,
            answerCount: nextCount,
            status:
                question.acceptedAnswerId === answerId
                    ? nextCount > 0
                        ? QUESTION_STATUS.ANSWERED
                        : QUESTION_STATUS.UNANSWERED
                    : question.status === QUESTION_STATUS.SOLVED
                      ? QUESTION_STATUS.SOLVED
                      : nextCount > 0
                        ? QUESTION_STATUS.ANSWERED
                        : QUESTION_STATUS.UNANSWERED,
            updatedAt: serverTimestamp()
        });
    });
}

export async function acceptAnswer(communityId, questionId, answerId) {
    const questionRef = questionReference(communityId, questionId);
    const answerRef = answerReference(communityId, questionId, answerId);
    await runTransaction(db, async (transaction) => {
        const questionSnapshot = await transaction.get(questionRef);
        if (!questionSnapshot.exists()) throw new Error("Question not found.");
        const previousId = questionSnapshot.data().acceptedAnswerId;
        if (previousId && previousId !== answerId) {
            transaction.update(
                answerReference(communityId, questionId, previousId),
                { accepted: false, updatedAt: serverTimestamp() }
            );
        }
        transaction.update(answerRef, {
            accepted: true,
            updatedAt: serverTimestamp()
        });
        transaction.update(questionRef, {
            acceptedAnswerId: answerId,
            status: QUESTION_STATUS.SOLVED,
            updatedAt: serverTimestamp()
        });
    });
}

export async function toggleAnswerUpvote(
    communityId,
    questionId,
    answerId,
    userId
) {
    const answerRef = answerReference(communityId, questionId, answerId);
    const voteRef = doc(answerRef, "upvotes", userId);
    return runTransaction(db, async (transaction) => {
        const [answerSnapshot, voteSnapshot] = await Promise.all([
            transaction.get(answerRef),
            transaction.get(voteRef)
        ]);
        if (!answerSnapshot.exists()) throw new Error("Answer not found.");
        if (answerSnapshot.data().authorId === userId) {
            throw new Error("You cannot upvote your own answer.");
        }
        const voted = voteSnapshot.exists();
        if (voted) transaction.delete(voteRef);
        else
            transaction.set(voteRef, {
                userId,
                recipientId: answerSnapshot.data().authorId,
                recipientName: answerSnapshot.data().authorName,
                createdAt: serverTimestamp()
            });
        transaction.update(answerRef, {
            upvoteCount: Math.max(
                0,
                Number(answerSnapshot.data().upvoteCount || 0) +
                    (voted ? -1 : 1)
            ),
            updatedAt: serverTimestamp()
        });
        return !voted;
    });
}

export async function toggleQuestionUpvote(communityId, questionId, userId) {
    const questionRef = questionReference(communityId, questionId);
    const voteRef = doc(questionRef, "upvotes", userId);
    return runTransaction(db, async (transaction) => {
        const [questionSnapshot, voteSnapshot] = await Promise.all([
            transaction.get(questionRef),
            transaction.get(voteRef)
        ]);
        if (!questionSnapshot.exists()) throw new Error("Question not found.");
        const question = questionSnapshot.data();
        if (question.authorId === userId) {
            throw new Error("You cannot upvote your own question.");
        }
        const voted = voteSnapshot.exists();
        if (voted) transaction.delete(voteRef);
        else
            transaction.set(voteRef, {
                userId,
                recipientId: question.authorId,
                recipientName: question.authorName,
                createdAt: serverTimestamp()
            });
        transaction.update(questionRef, {
            upvoteCount: Math.max(
                0,
                Number(question.upvoteCount || 0) + (voted ? -1 : 1)
            ),
            updatedAt: serverTimestamp()
        });
        return !voted;
    });
}

export async function hasAnswerUpvote(
    communityId,
    questionId,
    answerId,
    userId
) {
    const snapshot = await getDocs(
        query(
            collection(
                answerReference(communityId, questionId, answerId),
                "upvotes"
            ),
            where("userId", "==", userId),
            limit(1)
        )
    );
    return !snapshot.empty;
}

function commentCollection(communityId, questionId, answerId) {
    return collection(
        answerReference(communityId, questionId, answerId),
        "comments"
    );
}

export function subscribeToComments(
    communityId,
    questionId,
    answerId,
    onData,
    onError
) {
    return onSnapshot(
        query(
            commentCollection(communityId, questionId, answerId),
            orderBy("createdAt", "asc"),
            limit(PAGE_LIMIT)
        ),
        (snapshot) => onData(snapshot.docs.map(commentFromSnapshot)),
        onError
    );
}

export async function createComment(
    communityId,
    questionId,
    answerId,
    actor,
    content
) {
    const reference = doc(commentCollection(communityId, questionId, answerId));
    const timestamp = serverTimestamp();
    await setDoc(reference, {
        ...actorData(actor),
        content: validateCommentContent(content),
        createdAt: timestamp,
        updatedAt: timestamp
    });
    return reference.id;
}

export function updateComment(
    communityId,
    questionId,
    answerId,
    commentId,
    content
) {
    return updateDoc(
        doc(commentCollection(communityId, questionId, answerId), commentId),
        {
            content: validateCommentContent(content),
            updatedAt: serverTimestamp()
        }
    );
}

export function deleteComment(communityId, questionId, answerId, commentId) {
    return deleteDoc(
        doc(commentCollection(communityId, questionId, answerId), commentId)
    );
}

async function deleteNestedDocuments(collectionReference, batch) {
    const snapshot = await getDocs(
        query(collectionReference, limit(PAGE_LIMIT))
    );
    snapshot.docs.forEach((item) => batch.delete(item.ref));
}

export async function deleteQuestion(communityId, questionId) {
    const questionRef = questionReference(communityId, questionId);
    const answersSnapshot = await getDocs(
        query(answerCollection(communityId, questionId), limit(PAGE_LIMIT))
    );
    const batch = writeBatch(db);
    await deleteNestedDocuments(collection(questionRef, "upvotes"), batch);
    for (const answer of answersSnapshot.docs) {
        await Promise.all([
            deleteNestedDocuments(collection(answer.ref, "comments"), batch),
            deleteNestedDocuments(collection(answer.ref, "upvotes"), batch)
        ]);
        batch.delete(answer.ref);
    }
    batch.delete(questionRef);
    await batch.commit();
}

export async function getCommunityQuestionResources(communityId) {
    const snapshot = await getDocs(
        query(
            collectionGroup(db, "files"),
            where("communityId", "==", communityId),
            limit(PAGE_LIMIT)
        )
    );
    return snapshot.docs.map((item) => {
        const data = item.data();
        return {
            id: [data.communityId, data.channelId, item.id].join(":"),
            title:
                data.name ||
                data.originalName ||
                data.filename ||
                "Study resource"
        };
    });
}
