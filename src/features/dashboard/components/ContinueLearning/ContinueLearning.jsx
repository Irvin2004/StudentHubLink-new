import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./ContinueLearning.module.css";

export function ContinueLearning({ error, items = [], loading, onRetry }) {
    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <div className={styles.skeleton}>
                    <Skeleton width="40%" />
                    <Skeleton width="65%" />
                    <div className={styles.list}>
                        <Skeleton height="4.75rem" />
                        <Skeleton height="4.75rem" />
                        <Skeleton height="4.75rem" />
                    </div>
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

    if (!items.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    description="Your next study session will appear here."
                    icon="!"
                    title="Nothing to continue yet"
                />
            </section>
        );
    }

    return (
        <section aria-label="Continue learning" className={styles.card}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Continue Learning</h2>
                </div>
            </header>
            <div className={styles.list}>
                {items.map((item) => (
                    <article className={styles.item} key={item.id}>
                        <div className={styles.itemTop}>
                            <h3 className={styles.itemTitle}>{item.title}</h3>
                            <span className={styles.progressLabel}>
                                {item.progress}%
                            </span>
                        </div>
                        <div
                            aria-hidden="true"
                            className={styles.progressTrack}
                        >
                            <div
                                className={styles.progressFill}
                                style={{ width: `${item.progress}%` }}
                            />
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
