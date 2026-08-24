import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./AIAssistantCard.module.css";
import { AppIcon } from "../../../../components/common/AppIcon.jsx";

const defaultActions = [
    {
        label: "Summarise Notes",
        icon: "note",
        onClick: () => {}
    },
    {
        label: "Generate Flashcards",
        icon: "flashcards",
        onClick: () => {}
    },
    {
        label: "Create Quiz",
        icon: "quiz",
        onClick: () => {}
    },
    {
        label: "Explain a Topic",
        icon: "sparkles",
        onClick: () => {}
    },
    {
        label: "Suggest Study Plan",
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
                    title="AI assistant unavailable"
                />
            </Card>
        );
    }

    if (!actions.length) {
        return (
            <Card as="section" className={styles.card}>
                <EmptyState
                    description="Assistant shortcuts will appear here soon."
                    icon="🤖"
                    title="No assistant actions yet"
                />
            </Card>
        );
    }

    return (
        <Card
            as="section"
            aria-label="AI Study Assistant"
            className={styles.card}
        >
            <header className={styles.header}>
                <h2 className={styles.title}>
                    <AppIcon name="sparkles" size={20} />
                    <span>AI Study Assistant</span>
                </h2>
                <p className={styles.prompt}>What do you want help with?</p>
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
                    Ask AI <span aria-hidden="true">→</span>
                </button>
            </div>
        </Card>
    );
}

export default AIAssistantCard;
