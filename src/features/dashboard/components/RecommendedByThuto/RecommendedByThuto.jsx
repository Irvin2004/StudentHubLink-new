import Button from "../../../../components/ui/Button/index.js";
import styles from "./RecommendedByThuto.module.css";

export function RecommendedByThuto({
    error = null,
    loading = false,
    onAction,
    onAddToPlan,
    onRetry,
    recommendations = []
}) {
    return (
        <section
            aria-busy={loading || undefined}
            aria-labelledby="thuto-recommendations-title"
            className={styles.section}
        >
            <header className={styles.header}>
                <div>
                    <span>Adaptive study guidance</span>
                    <h2 id="thuto-recommendations-title">
                        Recommended by Thuto
                    </h2>
                </div>
                <p>
                    Based on your learning memory and current StudentHub work.
                </p>
            </header>

            {loading ? (
                <div className={styles.loading} role="status">
                    Thuto is reviewing your study activity…
                </div>
            ) : error ? (
                <div className={styles.empty} role="alert">
                    <p>Recommendations could not be loaded.</p>
                    <Button onClick={onRetry} size="small" variant="secondary">
                        Try again
                    </Button>
                </div>
            ) : recommendations.length ? (
                <ol className={styles.list}>
                    {recommendations.map((recommendation) => (
                        <li key={recommendation.id}>
                            <div>
                                <strong>{recommendation.title}</strong>
                                <p>{recommendation.reason}</p>
                                {recommendation.evidence ? (
                                    <small>
                                        Learning evidence:{" "}
                                        {recommendation.evidence}
                                    </small>
                                ) : null}
                            </div>
                            <div className={styles.actions}>
                                <Button
                                    onClick={() => onAction(recommendation)}
                                    size="small"
                                    variant="secondary"
                                >
                                    {recommendation.actionLabel}
                                </Button>
                                {!recommendation.alreadyPlanned &&
                                recommendation.studyPlan ? (
                                    <Button
                                        onClick={() =>
                                            onAddToPlan(recommendation)
                                        }
                                        size="small"
                                    >
                                        Add to Study Plan
                                    </Button>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className={styles.empty}>
                    <p>
                        Complete a study activity and Thuto will suggest a next
                        step here.
                    </p>
                </div>
            )}
        </section>
    );
}

export default RecommendedByThuto;
