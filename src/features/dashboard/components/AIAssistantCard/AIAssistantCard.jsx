import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./AIAssistantCard.module.css";
import { AppIcon } from "../../../../components/common/AppIcon.jsx";

const defaultActions = [
    {
        label: "Summarise with Thuto",
        icon: "note",
        onClick: () => {}
    },
    {
        label: "Create Flashcards",
        icon: "flashcards",
        onClick: () => {}
    },
    {
        label: "Create a Quiz",
        icon: "quiz",
        onClick: () => {}
    },
    {
        label: "Explain with Thuto",
        icon: "sparkles",
        onClick: () => {}
    },
    {
        label: "Plan My Study",
        icon: "calendar",
        onClick: () => {}
    }
];

export function AIAssistantCard({
    actions = defaultActions,
    error,
    loading,
    onAskAI = () => {},
    onRetry
}) {
    if (loading) {
        return (
            <Card as="section" className={styles.card} aria-busy="true">
                <Skeleton width="28%" />
                <Skeleton width="40%" />
                <div className={styles.skeletonGrid}>
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                    <Skeleton height="4.75rem" />
                </div>
                <Skeleton width="9rem" height="2.75rem" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card as="section" className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Thuto is unavailable"
                />
            </Card>
        );
    }

    if (!actions.length) {
        return (
            <Card as="section" className={styles.card}>
                <EmptyState
                    description="Thuto shortcuts will appear here soon."
                    icon="🤖"
                    title="No Thuto actions yet"
                />
            </Card>
        );
    }

    return (
        <Card
            as="section"
            aria-label="Thuto — Your Learning Companion"
            className={styles.card}
        >
            <header className={styles.header}>
                <h2 className={styles.title}>
                    <AppIcon name="sparkles" size={20} />
                    <span>Thuto — Your Learning Companion</span>
                </h2>
                <p className={styles.prompt}>
                    Hi, I’m Thuto 👋 What would you like to learn today?
                </p>
            </header>
            <div className={styles.grid}>
                {actions.map((action) => (
                    <button
                        className={styles.suggestion}
                        key={action.label}
                        onClick={action.onClick}
                        type="button"
                    >
                        <span aria-hidden="true" className={styles.icon}>
                            <AppIcon name={action.icon} size={18} />
                        </span>
                        <span className={styles.suggestionTitle}>
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>
            <div className={styles.footer}>
                <button
                    className={styles.askButton}
                    onClick={onAskAI}
                    type="button"
                >
                    Ask Thuto <span aria-hidden="true">→</span>
                </button>
            </div>
        </Card>
    );
}

export default AIAssistantCard;
