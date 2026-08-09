import Badge from "../../../../components/ui/Badge/Badge.jsx";
import Button from "../../../../components/ui/Button/Button.jsx";
import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./TodaysFocus.module.css";

const PRIORITY_VARIANTS = {
    High: "danger",
    Low: "success",
    Medium: "warning"
};

function getPriorityVariant(priority) {
    return PRIORITY_VARIANTS[priority] || "neutral";
}

export function TodaysFocus({
    error,
    loading,
    onBrowseResources,
    onContinue,
    task
}) {
    if (loading) {
        return (
            <section aria-busy="true" className={styles.card}>
                <div className={styles.loading}>
                    <Skeleton width="42%" />
                    <Skeleton width="72%" />
                    <Skeleton width="56%" />
                    <Skeleton width="9rem" />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.card}>
                <LoadErrorState
                    onRetry={onContinue}
                    title="Today's focus unavailable"
                />
            </section>
        );
    }

    if (!task) {
        return (
            <section className={styles.card}>
                <EmptyState
                    actionLabel="Browse Resources"
                    actionVariant="outline"
                    description="No tasks scheduled for today."
                    icon="🎉"
                    onAction={onBrowseResources}
                    title="You're all caught up!"
                />
            </section>
        );
    }

    return (
        <section aria-label="Today's Focus" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>
                    <span aria-hidden="true" className={styles.titleIcon}>
                        🎯
                    </span>
                    <span>Today's Focus</span>
                </h2>
            </header>

            <div className={styles.content}>
                <h3 className={styles.taskTitle}>{task.title}</h3>

                <dl className={styles.details}>
                    <div className={styles.detailItem}>
                        <dt className={styles.detailLabel}>Due</dt>
                        <dd className={styles.detailValue}>{task.due}</dd>
                    </div>
                    <div className={styles.detailItem}>
                        <dt className={styles.detailLabel}>Estimated Time</dt>
                        <dd className={styles.detailValue}>
                            {task.estimatedTime}
                        </dd>
                    </div>
                    <div className={styles.detailItem}>
                        <dt className={styles.detailLabel}>Priority</dt>
                        <dd className={styles.detailValue}>
                            <Badge variant={getPriorityVariant(task.priority)}>
                                {task.priority}
                            </Badge>
                        </dd>
                    </div>
                </dl>

                <Button className={styles.button} onClick={onContinue} type="button">
                    Continue
                </Button>
            </div>
        </section>
    );
}
