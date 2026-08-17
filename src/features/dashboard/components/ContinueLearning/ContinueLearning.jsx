import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import styles from "../DashboardListSection.module.css";
import { ResourceCard, ResourceCardSkeleton } from "./ResourceCard.jsx";

export function ContinueLearning({
    error,
    loading,
    onBrowseResources,
    onOpenFlashcards,
    onOpenQuiz,
    onOpenResource,
    onReviewFlashcards,
    onStartSession,
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
        <Card
            as="section"
            aria-label="Continue Learning"
            className={styles.card}
        >
            <header className={styles.header}>
                <h2 className={styles.title}>📚 Continue Learning</h2>
            </header>

            <div className={styles.list}>
                {resources.slice(0, 3).map((resource) => (
                    <ResourceCard
                        dueCount={resource.dueCount}
                        kind={resource.learningType}
                        key={resource.resourceKey || resource.id}
                        lastOpened={
                            resource.lastOpenedLabel || resource.lastOpened
                        }
                        onContinue={() =>
                            resource.learningType === "flashcard"
                                ? onOpenFlashcards?.(
                                      resource.deckId || resource.id
                                  )
                                : resource.learningType === "quiz"
                                  ? onOpenQuiz?.(resource.quizId || resource.id)
                                  : onOpenResource?.(
                                        resource.resourceKey || resource.id
                                    )
                        }
                        onStartSession={() =>
                            resource.learningType === "flashcard"
                                ? onReviewFlashcards?.(
                                      resource.deckId || resource.id
                                  )
                                : resource.learningType === "quiz"
                                  ? onOpenQuiz?.(resource.quizId || resource.id)
                                  : onStartSession?.(resource)
                        }
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
