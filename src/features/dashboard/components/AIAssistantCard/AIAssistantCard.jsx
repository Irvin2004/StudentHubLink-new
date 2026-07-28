import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./AIAssistantCard.module.css";

export function AIAssistantCard({ error, loading, onRetry, suggestions = [] }) {
    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <Skeleton width="28%" />
                <Skeleton width="62%" />
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
                    title="AI assistant unavailable"
                />
            </section>
        );
    }

    if (!suggestions.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    description="AI suggestions will appear once your dashboard is ready."
                    icon="!"
                    title="No AI suggestions yet"
                />
            </section>
        );
    }

    return (
        <section aria-label="AI Assistant" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>AI Assistant</h2>
            </header>
            <div className={styles.grid}>
                {suggestions.map((suggestion) => (
                    <button
                        className={styles.suggestion}
                        key={suggestion.id}
                        type="button"
                    >
                        <h3 className={styles.suggestionTitle}>
                            {suggestion.title}
                        </h3>
                    </button>
                ))}
            </div>
        </section>
    );
}
