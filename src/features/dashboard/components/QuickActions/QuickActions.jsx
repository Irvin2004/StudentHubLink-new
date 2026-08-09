import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./QuickActions.module.css";

export function QuickActions({ actions = [], error, loading, onRetry }) {
    if (loading) {
        return (
            <Card as="section" className={styles.card} aria-busy="true">
                <Skeleton width="32%" />
                <div className={styles.skeletonGrid}>
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card as="section" className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Quick actions unavailable"
                />
            </Card>
        );
    }

    if (!actions.length) {
        return (
            <Card as="section" className={styles.card}>
                <EmptyState
                    description="Your most used shortcuts will appear here."
                    icon="⚡"
                    title="No quick actions yet"
                />
            </Card>
        );
    }

    return (
        <Card as="section" aria-label="Quick Actions" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>⚡ Quick Actions</h2>
            </header>
            <div className={styles.grid}>
                {actions.map((action) => (
                    <button
                        className={styles.action}
                        key={action.label}
                        onClick={action.onClick}
                        type="button"
                    >
                        <span aria-hidden="true" className={styles.icon}>
                            {action.icon}
                        </span>
                        <span className={styles.actionLabel}>
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>
        </Card>
    );
}

export default QuickActions;
