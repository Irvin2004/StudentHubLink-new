import Button from "../../../../components/ui/Button/Button.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./ResourceCard.module.css";

function ProgressBar({ progress = 0 }) {
    const value = Math.min(100, Math.max(0, Number(progress) || 0));

    return (
        <div
            aria-label={`Resource progress ${value}%`}
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
        >
            <div
                className={styles.progressFill}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

export function ResourceCard({
    dueCount = 0,
    kind = "resource",
    lastOpened,
    onContinue,
    onStartSession,
    progress = null,
    subject,
    title
}) {
    return (
        <Card className={styles.card} padding="none">
            <div className={styles.content}>
                <div className={styles.copy}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.subject}>{subject}</p>
                </div>

                {progress !== null && progress !== undefined ? (
                    <div className={styles.progressGroup}>
                        <ProgressBar progress={progress} />
                        <p className={styles.progressValue}>{progress}%</p>
                    </div>
                ) : null}

                <p className={styles.lastOpened}>
                    {kind === "flashcard"
                        ? "Last studied"
                        : kind === "quiz"
                          ? "Last taken"
                          : "Last opened"}
                    : {lastOpened}
                </p>

                <Button
                    className={styles.button}
                    onClick={onContinue}
                    type="button"
                    variant="secondary"
                >
                    {kind === "flashcard"
                        ? "Open Deck"
                        : kind === "quiz"
                          ? "Open Quiz"
                          : "Continue"}
                </Button>
                <Button
                    className={styles.button}
                    disabled={kind === "flashcard" && !dueCount}
                    onClick={onStartSession}
                    type="button"
                >
                    {kind === "flashcard"
                        ? dueCount
                            ? `Review ${dueCount} Due`
                            : "No Cards Due"
                        : kind === "quiz"
                          ? "Try Again"
                          : "Start Session"}
                </Button>
            </div>
        </Card>
    );
}

export function ResourceCardSkeleton() {
    return (
        <Card className={styles.card} padding="none">
            <div className={styles.loading}>
                <Skeleton width="58%" />
                <Skeleton width="32%" />
                <Skeleton height="0.5rem" />
                <Skeleton width="44%" />
                <Skeleton height="2.75rem" />
            </div>
        </Card>
    );
}

export default ResourceCard;
