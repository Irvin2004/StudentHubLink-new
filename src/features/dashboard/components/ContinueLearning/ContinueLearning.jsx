import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import styles from "./ContinueLearning.module.css";
import { ResourceCard, ResourceCardSkeleton } from "./ResourceCard.jsx";

export function ContinueLearning({
    error,
    loading,
    onBrowseResources,
    onOpenResource,
    onRetry,
    resources = []
}) {
    if (loading) {
        return (
            <section aria-busy="true" className={styles.card}>
                <div className={styles.skeletonList}>
                    <ResourceCardSkeleton />
                    <ResourceCardSkeleton />
                    <ResourceCardSkeleton />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Learning list unavailable"
                />
            </section>
        );
    }

    if (!resources.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    actionLabel="Browse Resources"
                    actionVariant="outline"
                    description="You haven't started studying yet."
                    icon="📚"
                    onAction={onBrowseResources}
                    title="Continue Learning"
                />
            </section>
        );
    }

    return (
        <Card as="section" aria-label="Continue Learning" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>📚 Continue Learning</h2>
            </header>

            <div className={styles.list}>
                {resources.slice(0, 3).map((resource) => (
                    <ResourceCard
                        key={resource.id}
                        lastOpened={resource.lastOpened}
                        onContinue={() => onOpenResource?.(resource.id)}
                        progress={resource.progress}
                        subject={resource.subject}
                        title={resource.title}
                    />
                ))}
            </div>
        </Card>
    );
}

export default ContinueLearning;
