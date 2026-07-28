import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./QuickActions.module.css";

export function QuickActions({ actions = [], error, loading, onRetry }) {
    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <Skeleton width="32%" />
                <Skeleton width="56%" />
                <div className={styles.skeletonGrid}>
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Quick actions unavailable"
                />
            </section>
        );
    }

    if (!actions.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    description="Your most used shortcuts will appear here."
                    icon="!"
                    title="No quick actions yet"
                />
            </section>
        );
    }

    return (
        <section aria-label="Quick actions" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>Quick Actions</h2>
            </header>
            <div className={styles.grid}>
                {actions.map((action) => (
                    <button
                        className={styles.action}
                        key={action.id}
                        type="button"
                    >
                        <h3 className={styles.actionTitle}>{action.title}</h3>
                    </button>
                ))}
            </div>
        </section>
    );
}
