import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    writeBatch
} from "firebase/firestore";

import { db } from "../../../firebase/index.js";
import { getFlashcardDeckStats } from "../utils/flashcard-selectors.js";
import { getReviewSchedule } from "../utils/review-scheduling.js";

const DECK_LIMIT = 50;
const CARD_LIMIT = 500;

function requireId(value, label) {
    const id = String(value || "").trim();
    if (!id) throw new TypeError(`A ${label} is required.`);
    return id;
}

function deckCollection(userId) {
    return collection(
        db,
        "users",
        requireId(userId, "user ID"),
        "flashcardDecks"
    );
}

function deckReference(userId, deckId) {
    return doc(deckCollection(userId), requireId(deckId, "deck ID"));
}

function cardCollection(userId, deckId) {
    return collection(deckReference(userId, deckId), "cards");
}

function cardReference(userId, deckId, cardId) {
    return doc(cardCollection(userId, deckId), requireId(cardId, "card ID"));
}

function cleanText(value, fallback = "") {
    return String(value || fallback).trim();
}

export async function getFlashcardDecks(userId) {
    const snapshot = await getDocs(
        query(
            deckCollection(userId),
            orderBy("updatedAt", "desc"),
            limit(DECK_LIMIT)
        )
    );

    const now = new Date();
    return Promise.all(
        snapshot.docs.map(async (deckDocument) => {
            const cards = await getDocs(
                query(
                    cardCollection(userId, deckDocument.id),
                    limit(CARD_LIMIT)
                )
            );
            const cardData = cards.docs.map((cardDocument) =>
                cardDocument.data()
            );
            const stats = getFlashcardDeckStats(cardData, now);
            return {
                id: deckDocument.id,
                ...deckDocument.data(),
                cardCount: stats.totalCards,
                dueCount: stats.dueCards,
                masteryPercentage: stats.masteryPercentage,
                reviewedToday: stats.reviewedToday
            };
        })
    );
}

export async function getFlashcards(userId, deckId) {
    const snapshot = await getDocs(
        query(
            cardCollection(userId, deckId),
            orderBy("createdAt", "asc"),
            limit(CARD_LIMIT)
        )
    );
    return snapshot.docs.map((cardDocument) => ({
        id: cardDocument.id,
        ...cardDocument.data()
    }));
}

export async function createFlashcardDeck(userId, input) {
    const reference = doc(deckCollection(userId));
    const timestamp = serverTimestamp();
    const deck = {
        subject: cleanText(input.subject),
        title: cleanText(input.title),
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.resourceId ? { resourceId: cleanText(input.resourceId) } : {})
    };
    await setDoc(reference, deck);
    return {
        id: reference.id,
        ...deck,
        cardCount: 0,
        dueCount: 0,
        masteryPercentage: 0,
        reviewedToday: 0
    };
}

export async function recordFlashcardDeckStudied(userId, deckId) {
    const timestamp = serverTimestamp();
    await updateDoc(deckReference(userId, deckId), {
        lastStudiedAt: timestamp,
        updatedAt: timestamp
    });
    return { lastStudiedAt: new Date(), updatedAt: new Date() };
}

export async function deleteFlashcardDeck(userId, deckId) {
    let hasMore = true;
    while (hasMore) {
        const cards = await getDocs(
            query(cardCollection(userId, deckId), limit(450))
        );
        if (cards.empty) break;
        const batch = writeBatch(db);
        cards.docs.forEach((cardDocument) => batch.delete(cardDocument.ref));
        await batch.commit();
        hasMore = cards.size === 450;
    }

    const finalBatch = writeBatch(db);
    finalBatch.delete(deckReference(userId, deckId));
    await finalBatch.commit();
}

export async function createFlashcard(userId, deckId, input) {
    const reference = doc(cardCollection(userId, deckId));
    const timestamp = serverTimestamp();
    const card = {
        back: cleanText(input.back),
        front: cleanText(input.front),
        createdAt: timestamp,
        easeRating: null,
        lastReviewedAt: null,
        nextReviewAt: timestamp,
        reviewCount: 0,
        updatedAt: timestamp
    };
    const batch = writeBatch(db);
    batch.set(reference, card);
    batch.update(deckReference(userId, deckId), { updatedAt: timestamp });
    await batch.commit();
    return { id: reference.id, ...card };
}

export async function updateFlashcard(userId, deckId, cardId, changes) {
    const timestamp = serverTimestamp();
    const update = {
        back: cleanText(changes.back),
        front: cleanText(changes.front),
        updatedAt: timestamp
    };
    const batch = writeBatch(db);
    batch.update(cardReference(userId, deckId, cardId), update);
    batch.update(deckReference(userId, deckId), { updatedAt: timestamp });
    await batch.commit();
    return update;
}

export async function deleteFlashcard(userId, deckId, cardId) {
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    batch.delete(cardReference(userId, deckId, cardId));
    batch.update(deckReference(userId, deckId), { updatedAt: timestamp });
    await batch.commit();
}

export async function reviewFlashcard(
    userId,
    deckId,
    cardId,
    rating,
    reviewCount
) {
    const timestamp = serverTimestamp();
    const schedule = getReviewSchedule(rating);
    const update = {
        easeRating: schedule.easeRating,
        lastReviewedAt: timestamp,
        nextReviewAt: Timestamp.fromDate(schedule.nextReviewAt),
        reviewCount: Math.max(1, Number(reviewCount) || 1),
        updatedAt: timestamp
    };
    const batch = writeBatch(db);
    batch.update(cardReference(userId, deckId, cardId), update);
    batch.update(deckReference(userId, deckId), { updatedAt: timestamp });
    await batch.commit();
    return {
        ...update,
        lastReviewedAt: new Date(),
        nextReviewAt: schedule.nextReviewAt
    };
}
