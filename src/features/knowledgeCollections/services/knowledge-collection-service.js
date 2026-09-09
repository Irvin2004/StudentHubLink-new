import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
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
    getFlashcardDecks,
    getFlashcards
} from "../../flashcards/services/flashcard-service.js";
import {
    getQuizQuestions,
    getQuizzes
} from "../../quizzes/services/quiz-service.js";
import {
    collectionFromSnapshot,
    KNOWLEDGE_ITEM_TYPES,
    MAX_COLLECTION_ITEMS,
    normalizeKnowledgeItem,
    validateKnowledgeCollection
} from "../models/knowledge-collection.js";

const PAGE_LIMIT = 100;

function collectionsReference(communityId) {
    if (!communityId) throw new TypeError("A community ID is required.");
    return collection(db, "communities", communityId, "knowledgeCollections");
}

function collectionReference(communityId, collectionId) {
    return doc(collectionsReference(communityId), collectionId);
}

function suggestionsReference(communityId, collectionId) {
    return collection(
        collectionReference(communityId, collectionId),
        "suggestions"
    );
}

function actorRecord(actor) {
    if (!actor?.id)
        throw new TypeError("An authenticated student is required.");
    return {
        userId: actor.id,
        displayName:
            String(actor.displayName || "Student")
                .trim()
                .slice(0, 120) || "Student"
    };
}

function contributorsFor(items, existing = [], actor = null) {
    const records = new Map(
        existing.map((contributor) => [contributor.userId, contributor])
    );
    if (actor?.id) records.set(actor.id, actorRecord(actor));
    items.forEach((item) => {
        if (item.addedBy) {
            records.set(item.addedBy, {
                displayName: item.addedByName || "Student",
                userId: item.addedBy
            });
        }
    });
    return [...records.values()].slice(0, 30);
}

export function subscribeKnowledgeCollections(communityId, onData, onError) {
    return onSnapshot(
        query(
            collectionsReference(communityId),
            orderBy("updatedAt", "desc"),
            limit(PAGE_LIMIT)
        ),
        (snapshot) => onData(snapshot.docs.map(collectionFromSnapshot)),
        onError
    );
}

export async function getKnowledgeCollections(communityId) {
    const snapshot = await getDocs(
        query(
            collectionsReference(communityId),
            orderBy("updatedAt", "desc"),
            limit(PAGE_LIMIT)
        )
    );
    return snapshot.docs.map(collectionFromSnapshot);
}

export async function createKnowledgeCollection(communityId, actor, input) {
    const validated = validateKnowledgeCollection(input, actor);
    const reference = doc(collectionsReference(communityId));
    const timestamp = serverTimestamp();
    const value = {
        ...validated,
        contributors: contributorsFor(validated.items, [], actor),
        createdAt: timestamp,
        createdBy: actorRecord(actor).userId,
        createdByName: actorRecord(actor).displayName,
        itemCount: validated.items.length,
        updatedAt: timestamp,
        updatedBy: actor.id
    };
    await setDoc(reference, value);
    return { id: reference.id, ...value };
}

export async function updateKnowledgeCollection(
    communityId,
    collectionId,
    actor,
    input,
    existingContributors = []
) {
    const validated = validateKnowledgeCollection(input, actor);
    const value = {
        ...validated,
        contributors: contributorsFor(
            validated.items,
            existingContributors,
            actor
        ),
        itemCount: validated.items.length,
        updatedAt: serverTimestamp(),
        updatedBy: actor.id
    };
    await updateDoc(collectionReference(communityId, collectionId), value);
    return value;
}

async function deleteNestedCollection(reference) {
    let hasMore = true;
    while (hasMore) {
        const snapshot = await getDocs(query(reference, limit(400)));
        if (snapshot.empty) return;
        const batch = writeBatch(db);
        snapshot.docs.forEach((item) => batch.delete(item.ref));
        await batch.commit();
        hasMore = snapshot.size === 400;
    }
}

export async function deleteKnowledgeCollection(communityId, collectionId) {
    const reference = collectionReference(communityId, collectionId);
    await Promise.all([
        deleteNestedCollection(collection(reference, "saves")),
        deleteNestedCollection(collection(reference, "suggestions"))
    ]);
    await deleteDoc(reference);
}

export function subscribeCollectionSaved(
    communityId,
    collectionId,
    userId,
    onData,
    onError
) {
    return onSnapshot(
        doc(collectionReference(communityId, collectionId), "saves", userId),
        (snapshot) => onData(snapshot.exists()),
        onError
    );
}

export async function toggleCollectionSaved(communityId, collectionId, userId) {
    const reference = doc(
        collectionReference(communityId, collectionId),
        "saves",
        userId
    );
    const snapshot = await getDoc(reference);
    if (snapshot.exists()) {
        await deleteDoc(reference);
        return false;
    }
    await setDoc(reference, {
        collectionId,
        communityId,
        savedAt: serverTimestamp(),
        userId
    });
    return true;
}

export function subscribeCollectionSuggestions(
    communityId,
    collectionId,
    onData,
    onError
) {
    return onSnapshot(
        query(
            suggestionsReference(communityId, collectionId),
            orderBy("createdAt", "desc"),
            limit(PAGE_LIMIT)
        ),
        (snapshot) =>
            onData(
                snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
            ),
        onError
    );
}

export async function suggestCollectionItem(
    communityId,
    collectionId,
    actor,
    item,
    note = ""
) {
    const reference = doc(suggestionsReference(communityId, collectionId));
    const proposer = actorRecord(actor);
    await setDoc(reference, {
        createdAt: serverTimestamp(),
        item: normalizeKnowledgeItem(item, actor),
        note: String(note || "")
            .trim()
            .slice(0, 500),
        proposedBy: proposer.userId,
        proposedByName: proposer.displayName,
        reviewedAt: null,
        reviewedBy: null,
        status: "pending"
    });
    return reference.id;
}

export async function reviewCollectionSuggestion(
    communityId,
    collectionId,
    suggestionId,
    actor,
    decision
) {
    if (!["approved", "rejected"].includes(decision)) {
        throw new TypeError(
            "Choose whether to approve or reject the suggestion."
        );
    }
    const parent = collectionReference(communityId, collectionId);
    const suggestion = doc(
        suggestionsReference(communityId, collectionId),
        suggestionId
    );
    await runTransaction(db, async (transaction) => {
        const [parentSnapshot, suggestionSnapshot] = await Promise.all([
            transaction.get(parent),
            transaction.get(suggestion)
        ]);
        if (!parentSnapshot.exists() || !suggestionSnapshot.exists()) {
            throw new Error(
                "The collection suggestion is no longer available."
            );
        }
        const suggestionData = suggestionSnapshot.data();
        if (suggestionData.status !== "pending") return;
        const timestamp = serverTimestamp();
        if (decision === "approved") {
            const collectionData = parentSnapshot.data();
            const items = Array.isArray(collectionData.items)
                ? collectionData.items
                : [];
            if (
                items.length >= MAX_COLLECTION_ITEMS &&
                !items.some((item) => item.id === suggestionData.item.id)
            ) {
                throw new Error(
                    "This collection already has the maximum number of items."
                );
            }
            const nextItems = items.some(
                (item) => item.id === suggestionData.item.id
            )
                ? items
                : [...items, suggestionData.item];
            transaction.update(parent, {
                contributors: contributorsFor(
                    nextItems,
                    collectionData.contributors
                ),
                itemCount: nextItems.length,
                items: nextItems,
                updatedAt: timestamp,
                updatedBy: actor.id
            });
        }
        transaction.update(suggestion, {
            reviewedAt: timestamp,
            reviewedBy: actor.id,
            status: decision
        });
    });
}

function resourceCandidate(snapshot) {
    const data = snapshot.data();
    const sourceId = [data.communityId, data.channelId, snapshot.id].join(":");
    return {
        extension: data.extension || "",
        id: `resource:${sourceId}`,
        originalName: data.originalName || data.filename || "",
        sourceId,
        sourceType: KNOWLEDGE_ITEM_TYPES.RESOURCE,
        title: data.originalName || data.filename || "Study resource",
        url: data.url || ""
    };
}

export async function loadKnowledgeCollectionCandidates(communityId, userId) {
    const [files, questions, quizzes, decks] = await Promise.all([
        getDocs(
            query(
                collectionGroup(db, "files"),
                where("communityId", "==", communityId),
                limit(PAGE_LIMIT)
            )
        ),
        getDocs(
            query(
                collection(db, "communities", communityId, "questions"),
                limit(PAGE_LIMIT)
            )
        ),
        getQuizzes(userId),
        getFlashcardDecks(userId)
    ]);
    const candidates = files.docs.map(resourceCandidate);
    const solvedQuestions = questions.docs.filter(
        (item) => item.data().status === "solved"
    );
    for (const question of solvedQuestions) {
        const data = question.data();
        const answers = await getDocs(
            query(
                collection(question.ref, "answers"),
                orderBy("upvoteCount", "desc"),
                limit(20)
            )
        );
        let acceptedAnswer = answers.docs.find(
            (answer) => answer.data().accepted
        );
        if (!acceptedAnswer && data.acceptedAnswerId) {
            const snapshot = await getDoc(
                doc(question.ref, "answers", data.acceptedAnswerId)
            );
            if (snapshot.exists()) acceptedAnswer = snapshot;
        }
        candidates.push({
            content: [
                data.description,
                acceptedAnswer
                    ? `Accepted answer: ${acceptedAnswer.data().content}`
                    : ""
            ]
                .filter(Boolean)
                .join("\n\n"),
            id: `question:${question.id}`,
            sourceId: question.id,
            sourceType: KNOWLEDGE_ITEM_TYPES.QUESTION,
            title: data.title
        });
        const usefulAnswers = acceptedAnswer
            ? [
                  acceptedAnswer,
                  ...answers.docs.filter(
                      (answer) => answer.id !== acceptedAnswer.id
                  )
              ]
            : answers.docs;
        usefulAnswers
            .filter(
                (answer) =>
                    answer.data().accepted || answer.data().upvoteCount > 0
            )
            .forEach((answer) => {
                candidates.push({
                    content: `Question: ${data.title}\n\n${answer.data().content}`,
                    id: `answer:${question.id}:${answer.id}`,
                    sourceId: `${question.id}:${answer.id}`,
                    sourceType: KNOWLEDGE_ITEM_TYPES.ANSWER,
                    title: `${data.title} — ${answer.data().accepted ? "Accepted answer" : "Useful answer"}`
                });
            });
    }
    const quizCandidates = await Promise.all(
        quizzes.slice(0, 20).map(async (quiz) => {
            const quizQuestions = await getQuizQuestions(userId, quiz.id);
            return {
                content: quizQuestions
                    .map(
                        (question, index) =>
                            `${index + 1}. ${question.prompt}\nCorrect answer: ${question.options[question.correctOptionIndex]}`
                    )
                    .join("\n\n"),
                id: `quiz:${userId}:${quiz.id}`,
                sourceId: `${userId}:${quiz.id}`,
                sourceType: KNOWLEDGE_ITEM_TYPES.QUIZ,
                title: quiz.title
            };
        })
    );
    const deckCandidates = await Promise.all(
        decks.slice(0, 20).map(async (deck) => {
            const cards = await getFlashcards(userId, deck.id);
            return {
                content: cards
                    .map((card) => `${card.front} — ${card.back}`)
                    .join("\n"),
                id: `flashcard_set:${userId}:${deck.id}`,
                sourceId: `${userId}:${deck.id}`,
                sourceType: KNOWLEDGE_ITEM_TYPES.FLASHCARD_SET,
                title: deck.title
            };
        })
    );
    return [...candidates, ...quizCandidates, ...deckCandidates];
}
