import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import { StatCard } from "./StatCard.jsx";
import styles from "./StatsGrid.module.css";

const DEFAULT_STATS = [
    {
        color: "blue",
        icon: "👥",
        key: "communities",
        title: "Communities",
        value: 0
    },
    {
        color: "gold",
        icon: "📚",
        key: "resources",
        title: "Resources",
        value: 0
    },
    {
        color: "teal",
        icon: "💬",
        key: "messages",
        title: "Unread Messages",
        value: 0
    },
    {
        color: "rose",
        icon: "📝",
        key: "tasks",
        title: "Tasks",
        value: 0
    },
    {
        color: "gold",
        icon: "🃏",
        key: "dueFlashcards",
        title: "Due Flashcards",
        value: 0
    },
    {
        color: "blue",
        icon: "🎯",
        key: "recentQuizScore",
        title: "Recent Quiz",
        value: null
    },
    {
        color: "rose",
        icon: "📊",
        key: "weakQuizTopics",
        title: "Weak Quiz Topics",
        value: 0
    }
];

function normalizeStats(stats) {
    return DEFAULT_STATS.map((item) => ({
        ...item,
        value:
            item.key === "recentQuizScore"
                ? stats?.[item.key] == null
                    ? "—"
                    : `${Number(stats[item.key])}%`
                : Number(stats?.[item.key] ?? item.value)
    }));
}

export function StatsGrid({ error, loading, onRetry, stats }) {
    const items = normalizeStats(stats);

    if (loading) {
        return (
            <section aria-busy="true" className={styles.section}>
                <div className={styles.grid}>
                    {items.map((item) => (
                        <StatCard
                            color={item.color}
                            icon={item.icon}
                            key={item.key}
                            loading
                            title={item.title}
                            value={item.value}
                        />
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

    if (!items.length) {
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
                {items.map((item) => (
                    <StatCard
                        color={item.color}
                        icon={item.icon}
                        key={item.key}
                        title={item.title}
                        value={item.value}
                    />
                ))}
            </div>
        </section>
    );
}
