import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import styles from "../DashboardListSection.module.css";
import { DeadlineCard, DeadlineCardSkeleton } from "./DeadlineCard.jsx";

export function UpcomingDeadlines({
    deadlines = [],
    error,
    loading,
    onBrowseResources,
    onOpenAssignment,
    onRetry
}) {
    if (loading) {
        return (
            <section aria-busy="true" className={styles.card}>
                <div className={styles.skeletonList}>
                    <DeadlineCardSkeleton />
                    <DeadlineCardSkeleton />
                    <DeadlineCardSkeleton />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Deadlines unavailable"
                />
            </section>
        );
    }

    if (!deadlines.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    actionLabel="Open Study Planner"
                    actionVariant="outline"
                    description="You're all caught up!"
                    icon="🎉"
                    onAction={onBrowseResources}
                    title="No Upcoming Deadlines"
                />
            </section>
        );
    }

    return (
        <Card
            as="section"
            aria-label="Upcoming Deadlines"
            className={styles.card}
        >
            <header className={styles.header}>
                <h2 className={styles.title}>📅 Upcoming Deadlines</h2>
            </header>

            <div className={styles.list}>
                {deadlines.slice(0, 3).map((deadline) => (
                    <DeadlineCard
                        key={deadline.id}
                        due={deadline.due}
                        onOpen={() => onOpenAssignment?.(deadline.id)}
                        priority={deadline.priority}
                        subject={deadline.subject}
                        title={deadline.title}
                    />
                ))}
            </div>
        </Card>
    );
}

export default UpcomingDeadlines;
