import Button from "../../../../components/ui/Button/index.js";
import styles from "./MemoryRecommendations.module.css";

function formatSuggestedDate(value) {
    const date = new Date(`${value || ""}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        weekday: "short"
    }).format(date);
}

export function MemoryRecommendations({ onSchedule, recommendations = [] }) {
    if (!recommendations.length) return null;

    return (
        <section
            aria-labelledby="memory-recommendations-title"
            className={styles.section}
        >
            <header>
                <div>
                    <span>Thuto + Learning Memory</span>
                    <h2 id="memory-recommendations-title">
                        What to study next
                    </h2>
                </div>
                <p>Based on saved quiz, flashcard, and study evidence.</p>
            </header>
            <ol>
                {recommendations.map((recommendation) => (
                    <li key={recommendation.id}>
                        <div className={styles.content}>
                            <div>
                                <strong>{recommendation.title}</strong>
                                <span>{recommendation.subject}</span>
                            </div>
                            <p>{recommendation.reason}</p>
                            <small>{recommendation.evidence}</small>
                        </div>
                        <div className={styles.schedule}>
                            <span>
                                Suggested{" "}
                                {formatSuggestedDate(
                                    recommendation.studyPlan.dueDate
                                )}{" "}
                                · {recommendation.studyPlan.estimatedMinutes}{" "}
                                min · {recommendation.studyPlan.priority}
                            </span>
                            <Button
                                onClick={() => onSchedule(recommendation)}
                                size="small"
                            >
                                Review and schedule
                            </Button>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}

export default MemoryRecommendations;
