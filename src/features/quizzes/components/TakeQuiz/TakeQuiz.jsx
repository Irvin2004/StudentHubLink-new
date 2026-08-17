import { useEffect, useMemo, useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import { scoreQuiz } from "../../utils/quiz-scoring.js";
import {
    clearQuizSession,
    createQuizAttemptId,
    loadQuizSession,
    saveQuizSession
} from "../../utils/quiz-session-storage.js";
import styles from "./TakeQuiz.module.css";

export function TakeQuiz({
    onExit,
    onReviewFlashcards,
    onSaveAttempt,
    practiceWeak = false,
    questions,
    quiz,
    taskId = null
}) {
    const [initialSession] = useState(() => {
        const recovery = loadQuizSession(quiz.id, questions, practiceWeak);
        const recoveredStartedAt = new Date(recovery?.startedAt || new Date());
        const startedAt = Number.isFinite(recoveredStartedAt.getTime())
            ? recoveredStartedAt
            : new Date();
        return {
            durationSeconds: Math.max(
                0,
                Math.floor((Date.now() - startedAt.getTime()) / 1000)
            ),
            recovery,
            startedAt
        };
    });
    const recovery = initialSession.recovery;
    const startedAtRef = useRef(initialSession.startedAt);
    const attemptIdRef = useRef(
        recovery?.attemptId || createQuizAttemptId(quiz.id)
    );
    const submitLockRef = useRef(false);
    const [questionIndex, setQuestionIndex] = useState(() =>
        Math.min(
            questions.length - 1,
            Math.max(0, Number(recovery?.questionIndex) || 0)
        )
    );
    const [answers, setAnswers] = useState(() => recovery?.answers || {});
    const [result, setResult] = useState(null);
    const [reviewing, setReviewing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const currentQuestion = questions[questionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = ((questionIndex + 1) / questions.length) * 100;
    const [durationSeconds, setDurationSeconds] = useState(
        initialSession.durationSeconds
    );

    useEffect(() => {
        if (result) return undefined;
        saveQuizSession(quiz.id, {
            answers,
            attemptId: attemptIdRef.current,
            practiceWeak,
            questionIds: questions.map((question) => question.id),
            questionIndex,
            startedAt: startedAtRef.current.toISOString(),
            taskId
        });
        return undefined;
    }, [
        answers,
        practiceWeak,
        questionIndex,
        questions,
        quiz.id,
        result,
        taskId
    ]);

    useEffect(() => {
        if (result) return undefined;
        const updateDuration = () =>
            setDurationSeconds(
                Math.max(
                    0,
                    Math.floor(
                        (Date.now() - startedAtRef.current.getTime()) / 1000
                    )
                )
            );
        updateDuration();
        const interval = window.setInterval(updateDuration, 1000);
        return () => window.clearInterval(interval);
    }, [result]);

    const reviewedQuestions = useMemo(
        () =>
            result?.results.map((answerResult, index) => ({
                ...answerResult,
                ...questions[index]
            })) || [],
        [questions, result]
    );

    async function submitQuiz() {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        const nextResult = scoreQuiz(questions, answers);
        const nextDurationSeconds = Math.max(
            1,
            Math.round((Date.now() - startedAtRef.current.getTime()) / 1000)
        );
        const savedAnswers = nextResult.results.map((answerResult, index) => ({
            ...answerResult,
            options: questions[index].options,
            prompt: questions[index].prompt,
            ...(questions[index].sourceFlashcardId
                ? {
                      sourceFlashcardId: questions[index].sourceFlashcardId
                  }
                : {})
        }));
        setSubmitting(true);
        setError("");
        try {
            await onSaveAttempt({
                answers: savedAnswers,
                attemptId: attemptIdRef.current,
                durationSeconds: nextDurationSeconds,
                percentage: nextResult.percentage,
                quizId: quiz.id,
                score: nextResult.score,
                startedAt: startedAtRef.current,
                taskId,
                totalQuestions: nextResult.total
            });
            setDurationSeconds(nextDurationSeconds);
            clearQuizSession(quiz.id);
            setResult(nextResult);
        } catch {
            submitLockRef.current = false;
            setError("Your attempt could not be saved. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    function tryAgain() {
        setAnswers({});
        setError("");
        setQuestionIndex(0);
        setResult(null);
        setReviewing(false);
        startedAtRef.current = new Date();
        attemptIdRef.current = createQuizAttemptId(quiz.id);
        submitLockRef.current = false;
        setDurationSeconds(0);
    }

    function exitQuiz() {
        clearQuizSession(quiz.id);
        onExit?.();
    }

    if (result) {
        return (
            <main className={styles.resultsPage}>
                <section
                    aria-labelledby="quiz-results-title"
                    className={styles.resultsCard}
                >
                    <span className={styles.eyebrow}>{quiz.subject}</span>
                    <h1 id="quiz-results-title">
                        Quiz Complete <span aria-hidden="true">🎯</span>
                    </h1>
                    <p>
                        {quiz.title}
                        {practiceWeak ? " · Weak Questions Practice" : ""}
                    </p>
                    <div className={styles.scoreCircle}>
                        <span>Score</span>
                        <strong>
                            {result.score} / {result.total}
                        </strong>
                        <b>{result.percentage}%</b>
                    </div>
                    <dl className={styles.resultStats}>
                        <div>
                            <dt>Correct</dt>
                            <dd>{result.score}</dd>
                        </div>
                        <div>
                            <dt>Incorrect</dt>
                            <dd>{result.incorrect}</dd>
                        </div>
                        <div>
                            <dt>Time spent</dt>
                            <dd>
                                {Math.max(1, Math.ceil(durationSeconds / 60))}m
                            </dd>
                        </div>
                    </dl>
                    <div className={styles.resultActions}>
                        <Button
                            onClick={() => setReviewing((value) => !value)}
                            variant="outline"
                        >
                            {reviewing ? "Hide Review" : "Review Answers"}
                        </Button>
                        <Button onClick={tryAgain}>Try Again</Button>
                        {onReviewFlashcards &&
                        reviewedQuestions.some(
                            (question) =>
                                !question.correct && question.sourceFlashcardId
                        ) ? (
                            <Button
                                onClick={() =>
                                    onReviewFlashcards(
                                        reviewedQuestions
                                            .filter(
                                                (question) =>
                                                    !question.correct &&
                                                    question.sourceFlashcardId
                                            )
                                            .map(
                                                (question) =>
                                                    question.sourceFlashcardId
                                            )
                                    )
                                }
                                variant="outline"
                            >
                                Review as Flashcards
                            </Button>
                        ) : null}
                        <Button onClick={exitQuiz} variant="outline">
                            Back to Quiz
                        </Button>
                    </div>
                </section>
                {reviewing ? (
                    <section
                        aria-labelledby="answer-review-title"
                        className={styles.reviewSection}
                    >
                        <h2 id="answer-review-title">Answer Review</h2>
                        <ol>
                            {reviewedQuestions.map((question, index) => (
                                <li
                                    className={
                                        question.correct
                                            ? styles.correct
                                            : styles.incorrect
                                    }
                                    key={question.id}
                                >
                                    <div className={styles.reviewHeading}>
                                        <strong>
                                            {index + 1}. {question.prompt}
                                        </strong>
                                        <span>
                                            {question.correct
                                                ? "Correct"
                                                : "Incorrect"}
                                        </span>
                                    </div>
                                    <div className={styles.reviewSummary}>
                                        <p>
                                            <span>Your answer</span>
                                            <strong>
                                                {question.selectedOptionIndex ===
                                                null
                                                    ? "Not answered"
                                                    : question.options[
                                                          question
                                                              .selectedOptionIndex
                                                      ]}
                                            </strong>
                                        </p>
                                        <p>
                                            <span>Correct answer</span>
                                            <strong>
                                                {
                                                    question.options[
                                                        question
                                                            .correctOptionIndex
                                                    ]
                                                }
                                            </strong>
                                        </p>
                                    </div>
                                    <ul>
                                        {question.options.map(
                                            (option, optionIndex) => (
                                                <li
                                                    className={
                                                        optionIndex ===
                                                        question.correctOptionIndex
                                                            ? styles.correctOption
                                                            : optionIndex ===
                                                                question.selectedOptionIndex
                                                              ? styles.wrongOption
                                                              : ""
                                                    }
                                                    key={option}
                                                >
                                                    {option}
                                                    {optionIndex ===
                                                    question.correctOptionIndex
                                                        ? " — Correct answer"
                                                        : ""}
                                                    {optionIndex ===
                                                        question.selectedOptionIndex &&
                                                    !question.correct
                                                        ? " — Your answer"
                                                        : ""}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                    </section>
                ) : null}
            </main>
        );
    }

    return (
        <main className={styles.takePage}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>{quiz.subject}</span>
                    <h1>{quiz.title}</h1>
                    {practiceWeak ? <p>Practising weak questions</p> : null}
                </div>
                <Button onClick={exitQuiz} variant="outline">
                    Exit Quiz
                </Button>
            </header>
            <section
                aria-labelledby="quiz-question-title"
                className={styles.questionCard}
            >
                <div className={styles.progressRow}>
                    <strong>
                        Question {questionIndex + 1} / {questions.length}
                    </strong>
                    <span>{answeredCount} answered</span>
                    <span aria-label="Quiz time elapsed">
                        {String(Math.floor(durationSeconds / 60)).padStart(
                            2,
                            "0"
                        )}
                        :{String(durationSeconds % 60).padStart(2, "0")}
                    </span>
                </div>
                <div aria-hidden="true" className={styles.progressTrack}>
                    <span style={{ width: `${progress}%` }} />
                </div>
                <h2 id="quiz-question-title">{currentQuestion.prompt}</h2>
                <fieldset className={styles.answerOptions}>
                    <legend>Choose one answer</legend>
                    {currentQuestion.options.map((option, optionIndex) => (
                        <label key={option}>
                            <input
                                checked={
                                    answers[currentQuestion.id] === optionIndex
                                }
                                name={`answer-${currentQuestion.id}`}
                                onChange={() =>
                                    setAnswers((current) => ({
                                        ...current,
                                        [currentQuestion.id]: optionIndex
                                    }))
                                }
                                type="radio"
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </fieldset>
                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
                <nav
                    aria-label="Quiz question controls"
                    className={styles.controls}
                >
                    <Button
                        disabled={questionIndex === 0 || submitting}
                        onClick={() => setQuestionIndex((value) => value - 1)}
                        variant="outline"
                    >
                        Previous
                    </Button>
                    {questionIndex === questions.length - 1 ? (
                        <Button
                            loading={submitting}
                            loadingLabel="Submitting quiz"
                            onClick={() => void submitQuiz()}
                        >
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button
                            disabled={submitting}
                            onClick={() =>
                                setQuestionIndex((value) => value + 1)
                            }
                        >
                            Next
                        </Button>
                    )}
                </nav>
            </section>
        </main>
    );
}

export default TakeQuiz;
