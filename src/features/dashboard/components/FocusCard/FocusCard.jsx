/* eslint-disable react-refresh/only-export-components -- pure display helpers are colocated and unit-tested with this card. */
import Badge from "../../../../components/ui/Badge/Badge.jsx";
import Button from "../../../../components/ui/Button/Button.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./FocusCard.module.css";
import { formatStudyMinutes } from "../../../studySessions/utils/study-session-selectors.js";

const PRIORITY_VARIANTS = {
    high: "danger",
    low: "success",
    medium: "warning"
};

const FOCUS_TITLES = {
    assignment: "🎯 Today's Focus",
    quiz: "⚡ Next Priority",
    resource: "📚 Continue Learning",
    study: "⚡ Next Priority",
    flashcards: "🃏 Flashcards Due"
};

export function getPriorityColor(priority) {
    return PRIORITY_VARIANTS[String(priority || "").toLowerCase()] || "neutral";
}

export function getFocusTitle(task) {
    const taskType = String(task?.type || task?.kind || "").toLowerCase();

    return FOCUS_TITLES[taskType] || "🎯 Today's Focus";
}

function ChevronRightIcon() {
    return (
        <svg
            aria-hidden="true"
            className={styles.chevron}
            fill="none"
            viewBox="0 0 16 16"
        >
            <path
                d="m6 4 4 4-4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
            />
        </svg>
    );
}

function FocusProgress({ progress = 0 }) {
    const value = Math.min(100, Math.max(0, Number(progress) || 0));

    return (
        <div
            aria-label={`Weekly progress ${value}%`}
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
        >
            <div
                className={styles.progressFill}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

export function FocusCard({
    error,
    loading,
    onBrowseResources,
    onContinue,
    onRetry,
    onReviewFlashcards,
    onTakeQuiz,
    onStartSession,
    task,
    weeklyGoalMinutes = 300,
    weeklyMinutes = 0,
    weeklyProgress = 0
}) {
    if (loading) {
        return (
            <Card aria-busy="true" className={styles.card}>
                <div className={styles.loading}>
                    <Skeleton width="42%" />
                    <Skeleton width="72%" />
                    <Skeleton width="32%" />
                    <Skeleton width="55%" />
                    <Skeleton height="0.75rem" />
                    <Skeleton height="2.75rem" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Today's focus unavailable"
                />
            </Card>
        );
    }

    if (!task) {
        return (
            <Card className={styles.card}>
                <EmptyState
                    actionLabel="Open Study Planner"
                    actionVariant="outline"
                    description="No active study tasks need your attention."
                    icon="🎉"
                    onAction={onBrowseResources}
                    title="You're all caught up!"
                />
            </Card>
        );
    }

    const priorityVariant = getPriorityColor(task.priority);
    const title = getFocusTitle(task);
    const progress = Math.min(100, Math.max(0, Number(weeklyProgress) || 0));
    const flashcardFocus = task.type === "flashcards";
    const quizFocus = task.type === "quiz";

    return (
        <Card aria-label={title} className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>
                    <span>{title}</span>
                </h2>
                <Badge
                    className={styles.priorityBadge}
                    variant={priorityVariant}
                >
                    {String(task.priority || "High").toUpperCase()}
                </Badge>
            </header>

            <div className={styles.body}>
                <div className={styles.copy}>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    {task.subject ? (
                        <p className={styles.subject}>{task.subject}</p>
                    ) : null}
                </div>

                <dl className={styles.meta}>
                    <div className={styles.metaItem}>
                        <dt className={styles.metaLabel}>Due</dt>
                        <dd className={styles.metaValue}>⏰ {task.due}</dd>
                    </div>
                    <div className={styles.metaItem}>
                        <dt className={styles.metaLabel}>Estimated Time</dt>
                        <dd className={styles.metaValue}>
                            ⏱ {task.estimatedTime}
                        </dd>
                    </div>
                </dl>

                <div className={styles.progressGroup}>
                    <p className={styles.progressLabel}>
                        Weekly Goal · {formatStudyMinutes(weeklyMinutes)} /{" "}
                        {formatStudyMinutes(weeklyGoalMinutes)}
                    </p>
                    <FocusProgress progress={progress} />
                    <p className={styles.progressValue}>{progress}%</p>
                </div>

                <Button
                    className={styles.button}
                    onClick={() =>
                        flashcardFocus
                            ? onReviewFlashcards?.(task.flashcardDeckId)
                            : quizFocus
                              ? onTakeQuiz?.(task.quizId, task.id)
                              : onContinue?.(task.id)
                    }
                    type="button"
                    variant="secondary"
                >
                    <span>
                        {flashcardFocus
                            ? "Review Due Cards"
                            : quizFocus
                              ? "Take Quiz"
                              : "Open Task"}
                    </span>
                    <ChevronRightIcon />
                </Button>
                {!flashcardFocus && !quizFocus ? (
                    <Button
                        className={styles.button}
                        onClick={() => onStartSession?.(task)}
                        type="button"
                    >
                        Start Session
                    </Button>
                ) : null}
            </div>
        </Card>
    );
}

export default FocusCard;
