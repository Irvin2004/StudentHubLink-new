import { useEffect, useMemo, useRef, useState } from "react";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Card from "../../components/ui/Card/Card.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { ROUTES } from "../../config/routes.js";
import { DeleteQuizModal } from "./components/DeleteQuizModal/DeleteQuizModal.jsx";
import { QuestionModal } from "./components/QuestionModal/QuestionModal.jsx";
import { QuizModal } from "./components/QuizModal/QuizModal.jsx";
import { TakeQuiz } from "./components/TakeQuiz/TakeQuiz.jsx";
import { useQuizzes } from "./hooks/useQuizzes.js";
import { selectWeakQuestions } from "./utils/quiz-selectors.js";
import styles from "./QuizPage.module.css";

function QuizSkeletons() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading quizzes"
            className={styles.quizGrid}
        >
            {[0, 1, 2].map((item) => (
                <Card className={styles.skeleton} key={item}>
                    <Skeleton width="35%" />
                    <Skeleton width="75%" />
                    <Skeleton width="40%" />
                </Card>
            ))}
        </div>
    );
}

function navigateTo(url) {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function QuizPage() {
    useDocumentTitle("StudentHub - Quizzes", "quizzes");
    const {
        addQuestion,
        addQuiz,
        editQuestion,
        error,
        loading,
        mutationError,
        questions,
        questionsError,
        questionsLoading,
        recordAttempt,
        reload,
        removeQuestion,
        removeQuiz,
        selectQuiz,
        selectedQuiz,
        quizzes
    } = useQuizzes();
    const [quizModalOpen, setQuizModalOpen] = useState(false);
    const [questionModalOpen, setQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [deletingQuestion, setDeletingQuestion] = useState(null);
    const [deletingQuiz, setDeletingQuiz] = useState(null);
    const [takingQuiz, setTakingQuiz] = useState(null);
    const linkedQuizId = new URLSearchParams(window.location.search).get(
        "quiz"
    );
    const linkedMode = new URLSearchParams(window.location.search).get("mode");
    const linkedTaskId = new URLSearchParams(window.location.search).get(
        "task"
    );
    const handledLink = useRef(null);
    const weakQuestions = useMemo(
        () =>
            selectedQuiz
                ? selectWeakQuestions(questions, selectedQuiz.attempts)
                : [],
        [questions, selectedQuiz]
    );

    useEffect(() => {
        if (!linkedQuizId || loading || selectedQuiz?.id === linkedQuizId) {
            return;
        }
        if (quizzes.some((quiz) => quiz.id === linkedQuizId)) {
            selectQuiz(linkedQuizId);
        }
    }, [linkedQuizId, loading, quizzes, selectQuiz, selectedQuiz?.id]);

    useEffect(() => {
        const linkKey = `${linkedQuizId}:${linkedMode}`;
        const linkedQuestions =
            linkedMode === "weak" ? weakQuestions : questions;
        if (
            !["take", "weak"].includes(linkedMode) ||
            selectedQuiz?.id !== linkedQuizId ||
            questionsLoading ||
            !linkedQuestions.length ||
            handledLink.current === linkKey
        ) {
            return;
        }
        handledLink.current = linkKey;
        queueMicrotask(() =>
            setTakingQuiz({
                practiceWeak: linkedMode === "weak",
                questions: linkedQuestions
            })
        );
    }, [
        linkedMode,
        linkedQuizId,
        questions,
        questionsLoading,
        selectedQuiz?.id,
        weakQuestions
    ]);

    function openQuiz(quizId) {
        navigateTo(`${ROUTES.QUIZZES}?quiz=${encodeURIComponent(quizId)}`);
        selectQuiz(quizId);
    }

    function startQuiz(nextQuestions, practiceWeak = false) {
        navigateTo(
            `${ROUTES.QUIZZES}?quiz=${encodeURIComponent(selectedQuiz.id)}&mode=${practiceWeak ? "weak" : "take"}${linkedTaskId ? `&task=${encodeURIComponent(linkedTaskId)}` : ""}`
        );
        setTakingQuiz({ practiceWeak, questions: nextQuestions });
    }

    function exitQuiz() {
        navigateTo(
            `${ROUTES.QUIZZES}?quiz=${encodeURIComponent(selectedQuiz.id)}`
        );
        setTakingQuiz(null);
    }

    function openQuestion(question = null) {
        setEditingQuestion(question);
        setQuestionModalOpen(true);
    }

    function closeQuestion() {
        setEditingQuestion(null);
        setQuestionModalOpen(false);
    }

    if (takingQuiz && selectedQuiz && takingQuiz.questions.length) {
        return (
            <TakeQuiz
                onExit={exitQuiz}
                onReviewFlashcards={
                    selectedQuiz.flashcardDeckId
                        ? (cardIds) => {
                              navigateTo(
                                  `${ROUTES.FLASHCARDS}?deck=${encodeURIComponent(selectedQuiz.flashcardDeckId)}&mode=weak&cards=${cardIds.map(encodeURIComponent).join(",")}`
                              );
                          }
                        : undefined
                }
                onSaveAttempt={recordAttempt}
                practiceWeak={takingQuiz.practiceWeak}
                questions={takingQuiz.questions}
                quiz={selectedQuiz}
                taskId={linkedTaskId}
            />
        );
    }

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Quizzes</h1>
                    <p>
                        Create multiple-choice quizzes, test yourself, and save
                        every score.
                    </p>
                </div>
                <Button onClick={() => setQuizModalOpen(true)}>
                    Create Quiz
                </Button>
            </header>

            {mutationError ? (
                <p className={styles.errorBanner} role="alert">
                    That change could not be saved. Please try again.
                </p>
            ) : null}

            <section aria-labelledby="quiz-library-title">
                <div className={styles.sectionHeading}>
                    <div>
                        <h2 id="quiz-library-title">Your Quizzes</h2>
                        <p>
                            {quizzes.length}{" "}
                            {quizzes.length === 1 ? "quiz" : "quizzes"}
                        </p>
                    </div>
                </div>
                {loading ? (
                    <QuizSkeletons />
                ) : error ? (
                    <Card>
                        <LoadErrorState
                            onRetry={reload}
                            title="Quizzes unavailable"
                        />
                    </Card>
                ) : quizzes.length ? (
                    <div className={styles.quizGrid}>
                        {quizzes.map((quiz) => (
                            <article
                                className={`${styles.quizCard} ${selectedQuiz?.id === quiz.id ? styles.selectedQuiz : ""}`}
                                key={quiz.id}
                            >
                                <button
                                    aria-pressed={selectedQuiz?.id === quiz.id}
                                    className={styles.openQuiz}
                                    onClick={() => openQuiz(quiz.id)}
                                    type="button"
                                >
                                    <span className={styles.subject}>
                                        {quiz.subject}
                                    </span>
                                    <strong>{quiz.title}</strong>
                                    <span>
                                        {quiz.questionCount || 0}{" "}
                                        {(quiz.questionCount || 0) === 1
                                            ? "question"
                                            : "questions"}
                                    </span>
                                    <dl className={styles.quizStatsCompact}>
                                        <div>
                                            <dt>Attempts</dt>
                                            <dd>{quiz.stats?.attempts || 0}</dd>
                                        </div>
                                        <div>
                                            <dt>Best</dt>
                                            <dd>
                                                {quiz.stats?.bestScore || 0}%
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Latest</dt>
                                            <dd>
                                                {quiz.stats?.latestScore || 0}%
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Mastery</dt>
                                            <dd>
                                                {quiz.stats?.averageScore || 0}%
                                            </dd>
                                        </div>
                                    </dl>
                                </button>
                                <button
                                    aria-label={`Delete ${quiz.title}`}
                                    className={styles.deleteQuiz}
                                    onClick={() => setDeletingQuiz(quiz)}
                                    type="button"
                                >
                                    Delete
                                </button>
                            </article>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <EmptyState
                            actionLabel="Create Quiz"
                            description="Create your first quiz, then add four-option questions."
                            onAction={() => setQuizModalOpen(true)}
                            title="No quizzes yet"
                        />
                    </Card>
                )}
            </section>

            {!loading && !error && quizzes.length ? (
                <Card as="section" className={styles.questionsPanel}>
                    {selectedQuiz ? (
                        <>
                            <header className={styles.questionsHeader}>
                                <div>
                                    <span className={styles.subject}>
                                        {selectedQuiz.subject}
                                    </span>
                                    <h2>{selectedQuiz.title}</h2>
                                    <p>
                                        {questions.length}{" "}
                                        {questions.length === 1
                                            ? "question"
                                            : "questions"}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => openQuestion()}
                                    variant="outline"
                                >
                                    Add Question
                                </Button>
                                {questions.length && !questionsLoading ? (
                                    <Button
                                        onClick={() => startQuiz(questions)}
                                    >
                                        Take Quiz
                                    </Button>
                                ) : null}
                            </header>
                            <section
                                aria-label="Linked flashcard deck"
                                className={styles.linkedPanel}
                            >
                                {selectedQuiz.flashcardDeckId ? (
                                    <>
                                        <div>
                                            <strong>
                                                Linked flashcard deck
                                            </strong>
                                            <span>
                                                Review the source cards for this
                                                quiz.
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() =>
                                                navigateTo(
                                                    `${ROUTES.FLASHCARDS}?deck=${encodeURIComponent(selectedQuiz.flashcardDeckId)}`
                                                )
                                            }
                                            variant="outline"
                                        >
                                            Open Flashcard Deck
                                        </Button>
                                    </>
                                ) : (
                                    <div>
                                        <strong>
                                            No linked flashcard deck
                                        </strong>
                                        <span>
                                            This standalone quiz is not
                                            connected to a deck.
                                        </span>
                                    </div>
                                )}
                            </section>
                            {selectedQuiz.stats?.attempts ? (
                                <section
                                    aria-labelledby="selected-quiz-stats"
                                    className={styles.statsPanel}
                                >
                                    <h3 id="selected-quiz-stats">Quiz Stats</h3>
                                    <dl>
                                        <div>
                                            <dt>Attempts</dt>
                                            <dd>
                                                {selectedQuiz.stats.attempts}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Best score</dt>
                                            <dd>
                                                {selectedQuiz.stats.bestScore}%
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Latest score</dt>
                                            <dd>
                                                {selectedQuiz.stats.latestScore}
                                                %
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Mastery</dt>
                                            <dd>
                                                {
                                                    selectedQuiz.stats
                                                        .averageScore
                                                }
                                                %
                                            </dd>
                                        </div>
                                    </dl>
                                </section>
                            ) : null}
                            {weakQuestions.length ? (
                                <section
                                    aria-labelledby="weak-questions-title"
                                    className={styles.weakPanel}
                                >
                                    <div>
                                        <h3 id="weak-questions-title">
                                            Weak Questions
                                        </h3>
                                        <p>
                                            Questions missed across saved
                                            attempts.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() =>
                                            startQuiz(weakQuestions, true)
                                        }
                                        variant="outline"
                                    >
                                        Practice Weak Questions (
                                        {weakQuestions.length})
                                    </Button>
                                    <ol>
                                        {weakQuestions.map((question) => (
                                            <li key={question.id}>
                                                <span>{question.prompt}</span>
                                                <strong>
                                                    {question.incorrectCount}{" "}
                                                    missed
                                                </strong>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            ) : (
                                <section className={styles.weakPanel}>
                                    <div>
                                        <h3>No weak questions</h3>
                                        <p>
                                            {selectedQuiz.stats?.attempts
                                                ? "Nothing needs extra practice from your saved attempts."
                                                : "Complete a quiz to identify questions that need more practice."}
                                        </p>
                                    </div>
                                </section>
                            )}
                            {questionsLoading ? (
                                <div
                                    aria-busy="true"
                                    className={styles.questionList}
                                >
                                    <Skeleton height="9rem" />
                                    <Skeleton height="9rem" />
                                </div>
                            ) : questionsError ? (
                                <LoadErrorState title="Questions could not be loaded" />
                            ) : questions.length ? (
                                <ol className={styles.questionList}>
                                    {questions.map((question, index) => (
                                        <li key={question.id}>
                                            <article
                                                className={styles.questionCard}
                                            >
                                                <div
                                                    className={
                                                        styles.questionNumber
                                                    }
                                                >
                                                    Question {index + 1}
                                                </div>
                                                <div
                                                    className={
                                                        styles.questionContent
                                                    }
                                                >
                                                    <h3>{question.prompt}</h3>
                                                    <ol type="A">
                                                        {question.options.map(
                                                            (
                                                                option,
                                                                optionIndex
                                                            ) => (
                                                                <li
                                                                    className={
                                                                        optionIndex ===
                                                                        question.correctOptionIndex
                                                                            ? styles.correctAnswer
                                                                            : ""
                                                                    }
                                                                    key={option}
                                                                >
                                                                    {option}
                                                                    {optionIndex ===
                                                                    question.correctOptionIndex
                                                                        ? " (Correct)"
                                                                        : ""}
                                                                </li>
                                                            )
                                                        )}
                                                    </ol>
                                                </div>
                                                <div
                                                    className={
                                                        styles.questionActions
                                                    }
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            openQuestion(
                                                                question
                                                            )
                                                        }
                                                        variant="outline"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            setDeletingQuestion(
                                                                question
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
                            ) : (
                                <EmptyState
                                    actionLabel="Add Question"
                                    description="Add the first multiple-choice question to make this quiz playable."
                                    onAction={() => openQuestion()}
                                    title="This quiz has no questions"
                                />
                            )}
                        </>
                    ) : (
                        <EmptyState
                            description="Choose a quiz above to add questions or start an attempt."
                            title="Select a quiz"
                        />
                    )}
                </Card>
            ) : null}

            <QuizModal
                onClose={() => setQuizModalOpen(false)}
                onCreate={addQuiz}
                open={quizModalOpen}
            />
            <QuestionModal
                key={editingQuestion?.id || "new-question"}
                onClose={closeQuestion}
                onCreate={addQuestion}
                onUpdate={editQuestion}
                open={questionModalOpen}
                question={editingQuestion}
            />
            <DeleteQuizModal
                item={deletingQuestion}
                itemType="question"
                key={deletingQuestion?.id || "delete-question"}
                onClose={() => setDeletingQuestion(null)}
                onConfirm={removeQuestion}
                open={Boolean(deletingQuestion)}
            />
            <DeleteQuizModal
                item={deletingQuiz}
                itemType="quiz"
                key={deletingQuiz?.id || "delete-quiz"}
                onClose={() => setDeletingQuiz(null)}
                onConfirm={removeQuiz}
                open={Boolean(deletingQuiz)}
            />
        </main>
    );
}
