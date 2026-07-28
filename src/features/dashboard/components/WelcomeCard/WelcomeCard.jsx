import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./WelcomeCard.module.css";

export function WelcomeCard({ greeting, loading, error, onRetry }) {
    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <div className={styles.skeleton}>
                    <Skeleton
                        borderRadius="999px"
                        className={styles.skeletonHero}
                    />
                    <Skeleton
                        borderRadius="999px"
                        className={styles.skeletonBody}
                        count={2}
                    />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Welcome card unavailable"
                />
            </section>
        );
    }

    if (!greeting) {
        return (
            <section className={styles.card}>
                <EmptyState
                    description="No greeting is available right now."
                    icon="!"
                    title="Welcome data missing"
                />
            </section>
        );
    }

    return (
        <section className={styles.card}>
            <div className={styles.content}>
                <p className={styles.eyebrow}>Good Evening 👋</p>
                <h1 className={styles.title}>{greeting.message}</h1>
            </div>
        </section>
    );
}
