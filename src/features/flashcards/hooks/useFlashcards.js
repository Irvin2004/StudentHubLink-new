import { useCallback, useEffect, useMemo, useState } from "react";

import { ANALYTICS_EVENTS } from "../../../config/analytics-events.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAnalytics } from "../../../hooks/useAnalytics.js";
import { recordFlashcardLearningMemory } from "../../learningMemory/services/learning-memory-service.js";
import {
    createQuizFromFlashcardDeck,
    getQuizzes
} from "../../quizzes/services/quiz-service.js";
import { buildQuizQuestionsFromFlashcards } from "../../quizzes/utils/quiz-from-flashcards.js";
import {
    createFlashcard,
    createFlashcardDeck,
    deleteFlashcard,
    deleteFlashcardDeck,
    getFlashcardDecks,
    getFlashcards,
    recordFlashcardDeckStudied,
    reviewFlashcard,
    updateFlashcard
} from "../services/flashcard-service.js";
import { getFlashcardDeckStats } from "../utils/flashcard-selectors.js";

function deckStatsFields(cards) {
    const stats = getFlashcardDeckStats(cards);
    return {
        cardCount: stats.totalCards,
        dueCount: stats.dueCards,
        masteryPercentage: stats.masteryPercentage,
        reviewedToday: stats.reviewedToday
    };
}

export function useFlashcards() {
    const { track } = useAnalytics();
    const { user } = useAuth();
    const userId = user?.uid;
    const [decks, setDecks] = useState([]);
    const [cards, setCards] = useState([]);
    const [selectedDeckId, setSelectedDeckId] = useState(null);
    const [loading, setLoading] = useState(Boolean(userId));
    const [cardsLoading, setCardsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cardsError, setCardsError] = useState(null);
    const [mutationError, setMutationError] = useState(null);
    const [linkedQuizzes, setLinkedQuizzes] = useState([]);
    const [refreshIndex, setRefreshIndex] = useState(0);
    const reload = useCallback(
        () => setRefreshIndex((current) => current + 1),
        []
    );

    useEffect(() => {
        window.addEventListener("flashcards-updated", reload);
        return () => window.removeEventListener("flashcards-updated", reload);
    }, [reload]);

    useEffect(() => {
        if (!userId) return undefined;
        let active = true;

        async function loadDecks() {
            setLoading(true);
            setError(null);
            try {
                const [nextDecks, nextQuizzes] = await Promise.all([
                    getFlashcardDecks(userId),
                    getQuizzes(userId).catch(() => [])
                ]);
                if (active) {
                    setDecks(nextDecks);
                    setLinkedQuizzes(nextQuizzes);
                }
            } catch (nextError) {
                if (active) setError(nextError);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadDecks();
        return () => {
            active = false;
        };
    }, [refreshIndex, userId]);

    useEffect(() => {
        if (!userId || !selectedDeckId) return undefined;
        let active = true;

        async function loadCards() {
            setCardsLoading(true);
            setCardsError(null);
            try {
                const nextCards = await getFlashcards(userId, selectedDeckId);
                if (active) setCards(nextCards);
            } catch (nextError) {
                if (active) setCardsError(nextError);
            } finally {
                if (active) setCardsLoading(false);
            }
        }

        void loadCards();
        return () => {
            active = false;
        };
    }, [selectedDeckId, userId]);

    const selectedDeck = useMemo(
        () => decks.find((deck) => deck.id === selectedDeckId) || null,
        [decks, selectedDeckId]
    );

    const selectDeck = useCallback((deckId) => {
        setCards([]);
        setCardsError(null);
        setSelectedDeckId(deckId);
    }, []);

    const addDeck = useCallback(
        async (input) => {
            setMutationError(null);
            try {
                const created = await createFlashcardDeck(userId, input);
                const nextDeck = { ...created, updatedAt: new Date() };
                setDecks((current) => [nextDeck, ...current]);
                setCards([]);
                setSelectedDeckId(created.id);
                return created;
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }
        },
        [userId]
    );

    const removeDeck = useCallback(
        async (deckId) => {
            setMutationError(null);
            try {
                await deleteFlashcardDeck(userId, deckId);
                setDecks((current) =>
                    current.filter((deck) => deck.id !== deckId)
                );
                if (selectedDeckId === deckId) {
                    setSelectedDeckId(null);
                    setCards([]);
                }
                return true;
            } catch (nextError) {
                setMutationError(nextError);
                return false;
            }
        },
        [selectedDeckId, userId]
    );

    const addCard = useCallback(
        async (input) => {
            setMutationError(null);
            try {
                const created = await createFlashcard(
                    userId,
                    selectedDeckId,
                    input
                );
                const nextCard = {
                    ...created,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const nextCards = [...cards, nextCard];
                setCards(nextCards);
                setDecks((current) =>
                    current.map((deck) =>
                        deck.id === selectedDeckId
                            ? {
                                  ...deck,
                                  ...deckStatsFields(nextCards),
                                  updatedAt: new Date()
                              }
                            : deck
                    )
                );
                return created;
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }
        },
        [cards, selectedDeckId, userId]
    );

    const editCard = useCallback(
        async (cardId, changes) => {
            setMutationError(null);
            try {
                await updateFlashcard(userId, selectedDeckId, cardId, changes);
                setCards((current) =>
                    current.map((card) =>
                        card.id === cardId
                            ? { ...card, ...changes, updatedAt: new Date() }
                            : card
                    )
                );
                return true;
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }
        },
        [selectedDeckId, userId]
    );

    const removeCard = useCallback(
        async (cardId) => {
            setMutationError(null);
            try {
                await deleteFlashcard(userId, selectedDeckId, cardId);
                const nextCards = cards.filter((card) => card.id !== cardId);
                setCards(nextCards);
                setDecks((current) =>
                    current.map((deck) =>
                        deck.id === selectedDeckId
                            ? {
                                  ...deck,
                                  ...deckStatsFields(nextCards),
                                  updatedAt: new Date()
                              }
                            : deck
                    )
                );
                return true;
            } catch (nextError) {
                setMutationError(nextError);
                return false;
            }
        },
        [cards, selectedDeckId, userId]
    );

    const rateCard = useCallback(
        async (cardId, rating, incrementReview = true) => {
            setMutationError(null);
            const currentCard = cards.find((card) => card.id === cardId);
            const reviewCount =
                (Number(currentCard?.reviewCount) || 0) +
                (incrementReview ? 1 : 0);
            try {
                const update = await reviewFlashcard(
                    userId,
                    selectedDeckId,
                    cardId,
                    rating,
                    reviewCount
                );
                try {
                    await recordFlashcardLearningMemory(
                        userId,
                        selectedDeck,
                        currentCard,
                        rating,
                        `flashcard:${selectedDeckId}:${cardId}:${reviewCount}`
                    );
                } catch {
                    // The card review remains authoritative if memory sync fails.
                }
                const nextCard = { ...currentCard, ...update };
                const nextCards = cards.map((card) =>
                    card.id === cardId ? nextCard : card
                );
                setCards(nextCards);
                setDecks((current) =>
                    current.map((deck) =>
                        deck.id === selectedDeckId
                            ? {
                                  ...deck,
                                  ...deckStatsFields(nextCards),
                                  updatedAt: new Date()
                              }
                            : deck
                    )
                );
                return nextCard;
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }
        },
        [cards, selectedDeck, selectedDeckId, userId]
    );

    const finishStudy = useCallback(async () => {
        if (!userId || !selectedDeckId) return false;
        try {
            const update = await recordFlashcardDeckStudied(
                userId,
                selectedDeckId
            );
            setDecks((current) =>
                current.map((deck) =>
                    deck.id === selectedDeckId ? { ...deck, ...update } : deck
                )
            );
            window.dispatchEvent(new Event("flashcards-updated"));
            track(ANALYTICS_EVENTS.FLASHCARD_STUDY_COMPLETED, {
                cardCount: cards.length,
                dueCount: Math.max(0, Number(selectedDeck?.dueCount) || 0)
            });
            return true;
        } catch (nextError) {
            setMutationError(nextError);
            return false;
        }
    }, [cards.length, selectedDeck, selectedDeckId, track, userId]);

    const createQuizFromDeck = useCallback(async () => {
        if (!selectedDeck) throw new TypeError("Select a deck first.");
        setMutationError(null);
        try {
            const quiz = await createQuizFromFlashcardDeck(
                userId,
                selectedDeck,
                buildQuizQuestionsFromFlashcards(cards)
            );
            setLinkedQuizzes((current) => [quiz, ...current]);
            return quiz;
        } catch (nextError) {
            setMutationError(nextError);
            throw nextError;
        }
    }, [cards, selectedDeck, userId]);

    return {
        addCard,
        addDeck,
        cards,
        cardsError,
        cardsLoading,
        createQuizFromDeck,
        decks,
        editCard,
        error,
        finishStudy,
        loading,
        linkedQuizzes,
        mutationError,
        rateCard,
        reload,
        removeCard,
        removeDeck,
        selectDeck,
        selectedDeck
    };
}

export default useFlashcards;
