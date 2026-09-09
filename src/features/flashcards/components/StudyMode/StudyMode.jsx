import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import {
    formatReviewDate,
    getNextReviewAt,
    isCardDue,
    REVIEW_RATINGS
} from "../../utils/review-scheduling.js";
import {
    clearFlashcardStudySession,
    loadFlashcardStudySession,
    saveFlashcardStudySession
} from "../../utils/flashcard-session-storage.js";
import styles from "./StudyMode.module.css";

function formatElapsed(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function StudyMode({
    cards,
    allCards = cards,
    deck,
    onClose,
    onFinish,
    onRate,
    reviewDueOnly = false
}) {
    const [recoveredSession] = useState(() => {
        const stored = loadFlashcardStudySession();
        return stored?.deckId === deck.id ? stored : null;
    });
    const [cardIndex, setCardIndex] = useState(() =>
        Math.min(
            Math.max(0, Number(recoveredSession?.cardIndex) || 0),
            Math.max(0, cards.length - 1)
        )
    );
    const [flipped, setFlipped] = useState(() =>
        Boolean(recoveredSession?.flipped)
    );
    const [reviewedIds, setReviewedIds] = useState(
        () => new Set(recoveredSession?.reviewedIds || [])
    );
    const [ratings, setRatings] = useState(
        () => recoveredSession?.ratings || {}
    );
    const [reviewResults, setReviewResults] = useState(
        () => recoveredSession?.reviewResults || {}
    );
    const [ratingError, setRatingError] = useState(null);
    const [ratingSaving, setRatingSaving] = useState(false);
    const [startedAt, setStartedAt] = useState(
        () => recoveredSession?.startedAt || Date.now()
    );
    const [now, setNow] = useState(startedAt);
    const [finishedAt, setFinishedAt] = useState(null);
    const currentCard = cards[cardIndex];
    const finished = finishedAt !== null;
    const ratingInFlight = useRef(false);

    useEffect(() => {
        if (finished || !cards.length) return;
        saveFlashcardStudySession({
            cardIds: cards.map((card) => card.id),
            cardIndex,
            deckId: deck.id,
            flipped,
            ratings,
            reviewDueOnly,
            reviewResults,
            reviewedIds: [...reviewedIds],
            startedAt
        });
    }, [
        cardIndex,
        cards,
        deck.id,
        finished,
        flipped,
        ratings,
        reviewDueOnly,
        reviewResults,
        reviewedIds,
        startedAt
    ]);

    useEffect(() => {
        if (finished) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [finished]);

    const revealCard = useCallback(() => {
        if (finished || flipped || !currentCard) return;
        setFlipped(true);
        setReviewedIds((current) => {
            const next = new Set(current);
            next.add(currentCard.id);
            return next;
        });
    }, [currentCard, finished, flipped]);

    const showPrevious = useCallback(() => {
        if (finished || ratingSaving || cardIndex === 0) return;
        setCardIndex((current) => current - 1);
        setFlipped(false);
    }, [cardIndex, finished, ratingSaving]);

    const showNext = useCallback(() => {
        if (finished || ratingSaving) return;
        if (cardIndex === cards.length - 1) {
            const endedAt = Date.now();
            setNow(endedAt);
            setFinishedAt(endedAt);
            clearFlashcardStudySession();
            void onFinish?.();
            return;
        }
        setCardIndex((current) => current + 1);
        setFlipped(false);
    }, [cardIndex, cards.length, finished, onFinish, ratingSaving]);

    const handleRating = useCallback(
        async (rating) => {
            if (
                ratingInFlight.current ||
                !currentCard ||
                ratings[currentCard.id] === rating
            ) {
                return;
            }
            ratingInFlight.current = true;
            const firstRating = !ratings[currentCard.id];
            setRatingError(null);
            setRatingSaving(true);
            try {
                const updatedCard = onRate
                    ? await onRate(currentCard.id, rating, firstRating)
                    : currentCard;
                setRatings((current) => ({
                    ...current,
                    [currentCard.id]: rating
                }));
                setReviewResults((current) => ({
                    ...current,
                    [currentCard.id]: updatedCard
                }));
            } catch {
                setRatingError(
                    "That rating could not be saved. Please try again."
                );
            } finally {
                ratingInFlight.current = false;
                setRatingSaving(false);
            }
        },
        [currentCard, onRate, ratings]
    );

    useEffect(() => {
        function handleKeyDown(event) {
            if (
                event.target instanceof HTMLElement &&
                ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
                    event.target.tagName
                )
            ) {
                return;
            }

            if (event.code === "Space") {
                event.preventDefault();
                revealCard();
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                showPrevious();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                showNext();
            } else if (flipped && /^[1-4]$/.test(event.key)) {
                event.preventDefault();
                void handleRating(REVIEW_RATINGS[Number(event.key) - 1]);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [flipped, handleRating, revealCard, showNext, showPrevious]);

    const elapsed = (finishedAt || now) - startedAt;
    const completion = useMemo(
        () =>
            cards.length
                ? Math.round((reviewedIds.size / cards.length) * 100)
                : 0,
        [cards.length, reviewedIds]
    );
    const mergedCards = useMemo(
        () =>
            allCards.map((card) => ({
                ...card,
                ...(reviewResults[card.id] || {})
            })),
        [allCards, reviewResults]
    );
    const dueCardsReviewed = Object.keys(ratings).length;
    const cardsRemaining = finishedAt
        ? mergedCards.filter((card) => isCardDue(card, new Date(finishedAt)))
              .length
        : 0;
    const nextReviewAt = cardsRemaining
        ? new Date(finishedAt)
        : getNextReviewAt(mergedCards);

    if (finished) {
        return (
            <section
                aria-labelledby="study-summary-title"
                className={styles.summary}
            >
                <span className={styles.eyebrow}>
                    {reviewDueOnly ? "Review complete" : "Session complete"}
                </span>
                <h1 id="study-summary-title">Nice work!</h1>
                <p>You finished your {deck.title} study session.</p>
                <dl className={styles.summaryGrid}>
                    {reviewDueOnly ? (
                        <>
                            <div>
                                <dt>Due cards reviewed</dt>
                                <dd>{dueCardsReviewed}</dd>
                            </div>
                            <div>
                                <dt>Cards remaining</dt>
                                <dd>{cardsRemaining}</dd>
                            </div>
                            <div>
                                <dt>Next review</dt>
                                <dd>{formatReviewDate(nextReviewAt)}</dd>
                            </div>
                        </>
                    ) : (
                        <div>
                            <dt>Cards reviewed</dt>
                            <dd>
                                {reviewedIds.size} / {cards.length}
                            </dd>
                        </div>
                    )}
                    <div>
                        <dt>Time spent</dt>
                        <dd>{formatElapsed(elapsed)}</dd>
                    </div>
                    {!reviewDueOnly ? (
                        <div>
                            <dt>Completion</dt>
                            <dd>{completion}%</dd>
                        </div>
                    ) : null}
                </dl>
                <div className={styles.summaryActions}>
                    <Button
                        onClick={() => {
                            clearFlashcardStudySession();
                            onClose();
                        }}
                        variant="outline"
                    >
                        Back to Deck
                    </Button>
                    {!reviewDueOnly ? (
                        <Button
                            onClick={() => {
                                const restartedAt = Date.now();
                                setCardIndex(0);
                                setFlipped(false);
                                setReviewedIds(new Set());
                                setRatings({});
                                setReviewResults({});
                                setFinishedAt(null);
                                setStartedAt(restartedAt);
                                setNow(restartedAt);
                                clearFlashcardStudySession();
                            }}
                        >
                            Study Again
                        </Button>
                    ) : null}
                </div>
            </section>
        );
    }

    return (
        <section
            aria-labelledby="study-deck-title"
            className={styles.studyMode}
        >
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>{deck.subject}</span>
                    <h1 id="study-deck-title">{deck.title}</h1>
                </div>
                <Button
                    onClick={() => {
                        clearFlashcardStudySession();
                        onClose();
                    }}
                    variant="outline"
                >
                    Exit Study
                </Button>
            </header>

            <div className={styles.progressRow}>
                <strong aria-live="polite">
                    {cardIndex + 1} / {cards.length}
                </strong>
                <span>{reviewedIds.size} reviewed</span>
                <span aria-label={`Elapsed time ${formatElapsed(elapsed)}`}>
                    {formatElapsed(elapsed)}
                </span>
            </div>
            <div aria-hidden="true" className={styles.progressTrack}>
                <span
                    style={{
                        width: `${((cardIndex + 1) / cards.length) * 100}%`
                    }}
                />
            </div>

            <button
                aria-label={flipped ? "Card back" : "Card front. Flip card"}
                className={`${styles.flashcard} ${flipped ? styles.flipped : ""}`}
                onClick={revealCard}
                type="button"
            >
                <span className={styles.sideLabel}>
                    {flipped ? "Back" : "Front"}
                </span>
                <span className={styles.cardText}>
                    {flipped ? currentCard.back : currentCard.front}
                </span>
                {!flipped ? (
                    <span className={styles.flipHint}>
                        Click or press Space to flip
                    </span>
                ) : null}
            </button>

            {flipped ? (
                <fieldset className={styles.ratingGroup}>
                    <legend>How well did you know this?</legend>
                    <div>
                        {REVIEW_RATINGS.map((rating) => (
                            <button
                                aria-pressed={
                                    ratings[currentCard.id] === rating
                                }
                                className={styles[`rating${rating}`]}
                                disabled={ratingSaving}
                                key={rating}
                                onClick={() => void handleRating(rating)}
                                type="button"
                            >
                                <span aria-hidden="true">
                                    {REVIEW_RATINGS.indexOf(rating) + 1}
                                </span>{" "}
                                {rating}
                            </button>
                        ))}
                    </div>
                    {ratingError ? (
                        <p className={styles.ratingError} role="alert">
                            {ratingError}
                        </p>
                    ) : null}
                </fieldset>
            ) : (
                <p className={styles.ratingPlaceholder}>
                    Flip the card to rate your answer.
                </p>
            )}

            <nav aria-label="Study card controls" className={styles.controls}>
                <Button
                    disabled={ratingSaving || cardIndex === 0}
                    onClick={showPrevious}
                    variant="outline"
                >
                    Previous
                </Button>
                <Button disabled={ratingSaving} onClick={showNext}>
                    {cardIndex === cards.length - 1 ? "Finish Session" : "Next"}
                </Button>
            </nav>
            <p className={styles.shortcuts}>
                <kbd>Space</kbd> flip <kbd>←</kbd> previous <kbd>→</kbd> next
                <kbd>1–4</kbd> rate
            </p>
        </section>
    );
}

export default StudyMode;
