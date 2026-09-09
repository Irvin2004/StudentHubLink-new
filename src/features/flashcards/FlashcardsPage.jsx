import { useEffect, useRef, useState } from "react";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Card from "../../components/ui/Card/Card.jsx";
import Input from "../../components/ui/Input/Input.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { ROUTES } from "../../config/routes.js";
import { CardModal } from "./components/CardModal/CardModal.jsx";
import { DeckModal } from "./components/DeckModal/DeckModal.jsx";
import { DeleteFlashcardModal } from "./components/DeleteFlashcardModal/DeleteFlashcardModal.jsx";
import { StudyMode } from "./components/StudyMode/StudyMode.jsx";
import { useFlashcards } from "./hooks/useFlashcards.js";
import {
    filterFlashcardDecks,
    selectDueFlashcards
} from "./utils/flashcard-selectors.js";
import {
    clearFlashcardStudySession,
    loadFlashcardStudySession
} from "./utils/flashcard-session-storage.js";
import { canCreateQuizFromFlashcards } from "../quizzes/utils/quiz-from-flashcards.js";
import styles from "./FlashcardsPage.module.css";

function PlusIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
            />
        </svg>
    );
}

function DeckSkeletons() {
    return (
        <div aria-busy="true" className={styles.deckGrid}>
            {[0, 1, 2].map((item) => (
                <Card className={styles.deckSkeleton} key={item}>
                    <Skeleton width="38%" />
                    <Skeleton width="72%" />
                    <Skeleton width="28%" />
                </Card>
            ))}
        </div>
    );
}

function navigateTo(url) {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function FlashcardsPage() {
    useDocumentTitle("StudentHub - Flashcards", "flashcards");
    const {
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
        linkedQuizzes = [],
        mutationError,
        rateCard,
        reload,
        removeCard,
        removeDeck,
        selectDeck,
        selectedDeck
    } = useFlashcards();
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [deckModalOpen, setDeckModalOpen] = useState(false);
    const [cardModalOpen, setCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [deletingCard, setDeletingCard] = useState(null);
    const [deletingDeck, setDeletingDeck] = useState(null);
    const [studySession, setStudySession] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [reviewFilter, setReviewFilter] = useState("all");
    const [dueEmpty, setDueEmpty] = useState(false);
    const [recoverySession, setRecoverySession] = useState(() =>
        loadFlashcardStudySession()
    );
    const linkedDeckId = new URLSearchParams(window.location.search).get(
        "deck"
    );
    const linkedMode = new URLSearchParams(window.location.search).get("mode");
    const linkedCardIds = new URLSearchParams(window.location.search)
        .get("cards")
        ?.split(",")
        .filter(Boolean);
    const targetDeckId = linkedDeckId || recoverySession?.deckId;
    const visibleDecks = filterFlashcardDecks(decks, {
        query: searchTerm,
        reviewStatus: reviewFilter
    });
    const linkedQuiz = linkedQuizzes.find(
        (quiz) => quiz.flashcardDeckId === selectedDeck?.id
    );
    const handledStudyLink = useRef(null);

    useEffect(() => {
        if (!targetDeckId || loading || selectedDeck?.id === targetDeckId)
            return;
        if (decks.some((deck) => deck.id === targetDeckId)) {
            selectDeck(targetDeckId);
        }
    }, [decks, loading, selectDeck, selectedDeck?.id, targetDeckId]);

    useEffect(() => {
        const recovery = recoverySession;
        const resuming = recovery?.deckId === targetDeckId;
        const sessionMode = linkedMode || (resuming ? "recovery" : null);
        const linkKey = `${targetDeckId}:${sessionMode}:${linkedCardIds?.join(",") || ""}`;
        if (
            !targetDeckId ||
            !sessionMode ||
            selectedDeck?.id !== targetDeckId ||
            cardsLoading ||
            (!cards.length && selectedDeck.cardCount > 0) ||
            handledStudyLink.current === linkKey
        ) {
            return;
        }
        let sessionCards =
            linkedMode === "due" ? selectDueFlashcards(cards) : cards;
        if (linkedMode === "weak" && linkedCardIds?.length) {
            const linkedIds = new Set(linkedCardIds);
            sessionCards = cards.filter((card) => linkedIds.has(card.id));
        }
        if (resuming && recovery.cardIds?.length) {
            const cardOrder = new Map(
                recovery.cardIds.map((cardId, index) => [cardId, index])
            );
            sessionCards = cards
                .filter((card) => cardOrder.has(card.id))
                .sort(
                    (first, second) =>
                        cardOrder.get(first.id) - cardOrder.get(second.id)
                );
        }
        handledStudyLink.current = linkKey;
        let active = true;
        queueMicrotask(() => {
            if (active && sessionCards.length) {
                setStudySession({
                    cards: sessionCards,
                    reviewDueOnly:
                        linkedMode === "due" || recovery?.reviewDueOnly
                });
            } else if (active && linkedMode === "due") {
                setDueEmpty(true);
            }
        });
        return () => {
            active = false;
        };
    }, [
        cards,
        cardsLoading,
        linkedMode,
        linkedCardIds,
        recoverySession,
        selectedDeck,
        targetDeckId
    ]);

    function openAddCard() {
        setEditingCard(null);
        setCardModalOpen(true);
    }

    function openEditCard(card) {
        setEditingCard(card);
        setCardModalOpen(true);
    }

    function closeCardModal() {
        setCardModalOpen(false);
        setEditingCard(null);
    }

    function startStudying(reviewDueOnly = false) {
        const sessionCards = reviewDueOnly ? selectDueFlashcards(cards) : cards;
        setDueEmpty(reviewDueOnly && !sessionCards.length);
        if (!sessionCards.length) return;
        clearFlashcardStudySession();
        setRecoverySession(null);
        setStudySession({ cards: sessionCards, reviewDueOnly });
    }

    async function handleCreateQuiz() {
        setCreatingQuiz(true);
        try {
            const quiz = await createQuizFromDeck();
            navigateTo(`${ROUTES.QUIZZES}?quiz=${encodeURIComponent(quiz.id)}`);
        } finally {
            setCreatingQuiz(false);
        }
    }

    if (studySession && selectedDeck) {
        return (
            <main className={styles.studyPage}>
                <StudyMode
                    allCards={cards}
                    cards={studySession.cards}
                    deck={selectedDeck}
                    onClose={() => setStudySession(null)}
                    onFinish={finishStudy}
                    onRate={rateCard}
                    reviewDueOnly={studySession.reviewDueOnly}
                />
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Flashcards</h1>
                    <p>Create decks and manage the cards you want to review.</p>
                </div>
                <Button
                    icon={<PlusIcon />}
                    onClick={() => setDeckModalOpen(true)}
                >
                    Create Deck
                </Button>
            </header>

            {mutationError ? (
                <p className={styles.mutationError} role="alert">
                    That change could not be saved. Please try again.
                </p>
            ) : null}

            <section aria-labelledby="your-decks-title">
                <div className={styles.sectionHeading}>
                    <div>
                        <h2 id="your-decks-title">Your Decks</h2>
                        <p>
                            {decks.length}{" "}
                            {decks.length === 1 ? "deck" : "decks"}
                        </p>
                    </div>
                </div>

                {!loading && !error && decks.length ? (
                    <div className={styles.deckFilters}>
                        <Input
                            label="Search decks"
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Search by title or subject"
                            type="search"
                            value={searchTerm}
                        />
                        <fieldset>
                            <legend>Due-review status</legend>
                            <div>
                                {[
                                    ["all", "All"],
                                    ["due", "Due"],
                                    ["caught-up", "Caught up"]
                                ].map(([value, label]) => (
                                    <button
                                        aria-pressed={reviewFilter === value}
                                        key={value}
                                        onClick={() => setReviewFilter(value)}
                                        type="button"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                ) : null}

                {loading ? (
                    <DeckSkeletons />
                ) : error ? (
                    <Card>
                        <LoadErrorState
                            onRetry={reload}
                            title="Flashcard decks unavailable"
                        />
                    </Card>
                ) : decks.length && visibleDecks.length ? (
                    <div className={styles.deckGrid}>
                        {visibleDecks.map((deck) => (
                            <article
                                className={`${styles.deckCard} ${
                                    selectedDeck?.id === deck.id
                                        ? styles.selectedDeck
                                        : ""
                                }`}
                                key={deck.id}
                            >
                                <button
                                    aria-pressed={selectedDeck?.id === deck.id}
                                    className={styles.deckOpen}
                                    onClick={() => selectDeck(deck.id)}
                                    type="button"
                                >
                                    <span className={styles.subject}>
                                        {deck.subject}
                                    </span>
                                    <strong>{deck.title}</strong>
                                    <dl className={styles.deckStats}>
                                        <div>
                                            <dt>Cards</dt>
                                            <dd>{deck.cardCount}</dd>
                                        </div>
                                        <div>
                                            <dt>Due</dt>
                                            <dd>{deck.dueCount || 0}</dd>
                                        </div>
                                        <div>
                                            <dt>Today</dt>
                                            <dd>{deck.reviewedToday || 0}</dd>
                                        </div>
                                        <div>
                                            <dt>Mastery</dt>
                                            <dd>
                                                {deck.masteryPercentage || 0}%
                                            </dd>
                                        </div>
                                    </dl>
                                </button>
                                <button
                                    aria-label={`Delete ${deck.title}`}
                                    className={styles.deleteDeck}
                                    onClick={() => setDeletingDeck(deck)}
                                    type="button"
                                >
                                    Delete
                                </button>
                            </article>
                        ))}
                    </div>
                ) : decks.length ? (
                    <Card>
                        <EmptyState
                            actionLabel="Clear filters"
                            description="Try a different title, subject, or due-review status."
                            onAction={() => {
                                setSearchTerm("");
                                setReviewFilter("all");
                            }}
                            title="No matching decks"
                        />
                    </Card>
                ) : (
                    <Card>
                        <EmptyState
                            actionLabel="Create Deck"
                            actionVariant="primary"
                            description="Create your first deck, then add prompts and answers."
                            onAction={() => setDeckModalOpen(true)}
                            title="No flashcard decks yet"
                        />
                    </Card>
                )}
            </section>

            {!loading && !error && decks.length ? (
                <Card as="section" className={styles.cardsPanel}>
                    {selectedDeck ? (
                        <>
                            <header className={styles.cardsHeader}>
                                <div>
                                    <span className={styles.subject}>
                                        {selectedDeck.subject}
                                    </span>
                                    <h2>{selectedDeck.title}</h2>
                                    <p>
                                        {selectedDeck.cardCount}{" "}
                                        {selectedDeck.cardCount === 1
                                            ? "card"
                                            : "cards"}
                                    </p>
                                </div>
                                <Button
                                    icon={<PlusIcon />}
                                    onClick={openAddCard}
                                    variant="outline"
                                >
                                    Add Card
                                </Button>
                                {cards.length && !cardsLoading ? (
                                    <Button
                                        onClick={() => startStudying(false)}
                                    >
                                        Start Studying
                                    </Button>
                                ) : null}
                                {selectedDeck.dueCount > 0 && !cardsLoading ? (
                                    <Button
                                        onClick={() => startStudying(true)}
                                        variant="outline"
                                    >
                                        Review Due Cards (
                                        {selectedDeck.dueCount})
                                    </Button>
                                ) : null}
                                {!cardsLoading ? (
                                    <Button
                                        disabled={
                                            !canCreateQuizFromFlashcards(cards)
                                        }
                                        loading={creatingQuiz}
                                        loadingLabel="Creating quiz"
                                        onClick={() => void handleCreateQuiz()}
                                        title={
                                            canCreateQuizFromFlashcards(cards)
                                                ? undefined
                                                : "Add at least four cards with different answers"
                                        }
                                        variant="outline"
                                    >
                                        Create Quiz from Deck
                                    </Button>
                                ) : null}
                                {linkedQuiz ? (
                                    <Button
                                        onClick={() =>
                                            navigateTo(
                                                `${ROUTES.QUIZZES}?quiz=${encodeURIComponent(linkedQuiz.id)}`
                                            )
                                        }
                                        variant="outline"
                                    >
                                        Open Linked Quiz
                                    </Button>
                                ) : null}
                            </header>

                            {cardsLoading ? (
                                <div
                                    aria-busy="true"
                                    className={styles.cardList}
                                >
                                    <Skeleton height="8rem" />
                                    <Skeleton height="8rem" />
                                </div>
                            ) : cardsError ? (
                                <LoadErrorState title="Cards could not be loaded" />
                            ) : cards.length ? (
                                <>
                                    {dueEmpty ? (
                                        <p
                                            className={styles.caughtUp}
                                            role="status"
                                        >
                                            You’re all caught up — this deck has
                                            no cards due right now.
                                        </p>
                                    ) : null}
                                    <ol className={styles.cardList}>
                                        {cards.map((card, index) => (
                                            <li key={card.id}>
                                                <article
                                                    className={styles.studyCard}
                                                >
                                                    <div
                                                        className={
                                                            styles.cardNumber
                                                        }
                                                    >
                                                        Card {index + 1}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.cardSides
                                                        }
                                                    >
                                                        <section>
                                                            <h3>Front</h3>
                                                            <p>{card.front}</p>
                                                        </section>
                                                        <section>
                                                            <h3>Back</h3>
                                                            <p>{card.back}</p>
                                                        </section>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.cardActions
                                                        }
                                                    >
                                                        <Button
                                                            onClick={() =>
                                                                openEditCard(
                                                                    card
                                                                )
                                                            }
                                                            variant="outline"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() =>
                                                                setDeletingCard(
                                                                    card
                                                                )
                                                            }
                                                            variant="danger"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </article>
                                            </li>
                                        ))}
                                    </ol>
                                </>
                            ) : (
                                <EmptyState
                                    actionLabel="Add Card"
                                    actionVariant="primary"
                                    description="Add a front and back to begin building this deck."
                                    onAction={openAddCard}
                                    title="This deck has no cards"
                                />
                            )}
                        </>
                    ) : (
                        <EmptyState
                            description="Choose a deck above to view and manage its cards."
                            title="Select a deck"
                        />
                    )}
                </Card>
            ) : null}

            <DeckModal
                onClose={() => setDeckModalOpen(false)}
                onCreate={addDeck}
                open={deckModalOpen}
            />
            <CardModal
                card={editingCard}
                key={editingCard?.id || "new-card"}
                onClose={closeCardModal}
                onCreate={addCard}
                onUpdate={editCard}
                open={cardModalOpen}
            />
            <DeleteFlashcardModal
                item={deletingCard}
                itemType="card"
                key={deletingCard?.id || "delete-card"}
                onClose={() => setDeletingCard(null)}
                onConfirm={removeCard}
                open={Boolean(deletingCard)}
            />
            <DeleteFlashcardModal
                item={deletingDeck}
                itemType="deck"
                key={deletingDeck?.id || "delete-deck"}
                onClose={() => setDeletingDeck(null)}
                onConfirm={removeDeck}
                open={Boolean(deletingDeck)}
            />
        </main>
    );
}
