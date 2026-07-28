import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./RecentActivity.module.css";

export function RecentActivity({ activity = [], error, loading, onRetry }) {
    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <Skeleton width="36%" />
                <Skeleton width="56%" />
                <div className={styles.list}>
                    <Skeleton height="4.5rem" />
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
                    title="Activity unavailable"
                />
            </section>
        );
    }

    if (!activity.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    description="Recent classroom activity will appear here."
                    icon="!"
                    title="Nothing recent yet"
                />
            </section>
        );
    }

    return (
        <section aria-label="Recent activity" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>Recent Activity</h2>
            </header>
            <div className={styles.list}>
                {activity.map((item) => (
                    <article className={styles.item} key={item.id}>
                        <span aria-hidden="true" className={styles.dot} />
                        <div className={styles.copy}>
                            <h3 className={styles.itemTitle}>{item.title}</h3>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
