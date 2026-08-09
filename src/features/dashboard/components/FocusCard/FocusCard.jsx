import Badge from "../../../../components/ui/Badge/Badge.jsx";
import Button from "../../../../components/ui/Button/Button.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./FocusCard.module.css";

const PRIORITY_VARIANTS = {
    high: "danger",
    low: "success",
    medium: "warning"
};

const FOCUS_TITLES = {
    assignment: "🎯 Today's Focus",
    quiz: "⚡ Next Priority",
    resource: "📚 Continue Learning",
    study: "⚡ Next Priority"
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
            aria-label={`Focus progress ${value}%`}
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
        >
            <div className={styles.progressFill} style={{ width: `${value}%` }} />
        </div>
    );
}

export function FocusCard({
    error,
    loading,
    onBrowseResources,
    onContinue,
    onRetry,
    task
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
                    actionLabel="Browse Resources"
                    actionVariant="outline"
                    description="No focus task for today."
                    icon="🎉"
                    onAction={onBrowseResources}
                    title="You're all caught up!"
                />
            </Card>
        );
    }

    const priorityVariant = getPriorityColor(task.priority);
    const title = getFocusTitle(task);
    const progress = Math.min(100, Math.max(0, Number(task.progress) || 0));

    return (
        <Card aria-label={title} className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>
                    <span>{title}</span>
                </h2>
                <Badge className={styles.priorityBadge} variant={priorityVariant}>
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
                        <dd className={styles.metaValue}>⏱ {task.estimatedTime}</dd>
                    </div>
                </dl>

                <div className={styles.progressGroup}>
                    <FocusProgress progress={progress} />
                    <p className={styles.progressValue}>{progress}%</p>
                </div>

                <Button
                    className={styles.button}
                    onClick={() => onContinue?.(task.id)}
                    type="button"
                    variant="secondary"
                >
                    <span>Continue Learning</span>
                    <ChevronRightIcon />
                </Button>
            </div>
        </Card>
    );
}

export default FocusCard;
