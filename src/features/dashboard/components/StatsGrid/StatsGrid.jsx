import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./StatsGrid.module.css";

const STAT_ITEMS = [
    { key: "communities", label: "Communities" },
    { key: "resources", label: "Resources" },
    { key: "messages", label: "Messages" },
    { key: "assignments", label: "Assignments" }
];

export function StatsGrid({ error, loading, onRetry, stats }) {
    if (loading) {
        return (
            <section aria-busy="true" className={styles.section}>
                <div className={styles.skeletonGrid}>
                    {STAT_ITEMS.map((item) => (
                        <div className={styles.skeletonCard} key={item.key}>
                            <div className={styles.skeletonStack}>
                                <Skeleton width="45%" />
                                <Skeleton height="2rem" width="55%" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.section}>
                <LoadErrorState onRetry={onRetry} title="Stats unavailable" />
            </section>
        );
    }

    if (!stats) {
        return (
            <section className={styles.section}>
                <EmptyState
                    description="There are no stats to show yet."
                    icon="!"
                    title="No stats available"
                />
            </section>
        );
    }

    return (
        <section aria-label="Dashboard stats" className={styles.section}>
            <div className={styles.grid}>
                {STAT_ITEMS.map((item) => (
                    <article className={styles.stat} key={item.key}>
                        <p className={styles.label}>{item.label}</p>
                        <p className={styles.value}>{stats[item.key] ?? 0}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
