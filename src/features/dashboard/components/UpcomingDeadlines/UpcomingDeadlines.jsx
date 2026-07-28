import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./UpcomingDeadlines.module.css";

export function UpcomingDeadlines({ deadlines = [], error, loading, onRetry }) {
    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <Skeleton width="42%" />
                <Skeleton width="60%" />
                <div className={styles.list}>
                    <Skeleton height="4.5rem" />
                    <Skeleton height="4.5rem" />
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
                    description="Your next due dates will show up here."
                    icon="!"
                    title="No deadlines yet"
                />
            </section>
        );
    }

    return (
        <section aria-label="Upcoming deadlines" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>Upcoming Deadlines</h2>
            </header>
            <div className={styles.list}>
                {deadlines.map((deadline) => (
                    <article className={styles.item} key={deadline.id}>
                        <div className={styles.itemTop}>
                            <h3 className={styles.itemTitle}>
                                {deadline.title}
                            </h3>
                            <span className={styles.due}>{deadline.due}</span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
