import Button from "../../../../components/ui/Button/Button.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./DeadlineCard.module.css";

const PRIORITY_MARKS = {
    high: "🔴",
    low: "🟢",
    medium: "🟡"
};

function getPriorityMark(priority) {
    return PRIORITY_MARKS[String(priority || "").toLowerCase()] || "⚪";
}

export function DeadlineCard({
    due,
    onOpen,
    priority,
    subject,
    title
}) {
    return (
        <Card className={styles.card} padding="none">
            <div className={styles.content}>
                <div className={styles.copy}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.subject}>{subject}</p>
                    <p className={styles.due}>
                        <span aria-hidden="true">
                            {getPriorityMark(priority)}
                        </span>
                        <span>Due {due}</span>
                    </p>
                </div>

                <Button
                    className={styles.button}
                    onClick={onOpen}
                    type="button"
                    variant="secondary"
                >
                    Open
                </Button>
            </div>
        </Card>
    );
}

export function DeadlineCardSkeleton() {
    return (
        <Card className={styles.card} padding="none">
            <div className={styles.loading}>
                <Skeleton width="56%" />
                <Skeleton width="34%" />
                <Skeleton width="42%" />
                <Skeleton height="2.75rem" />
            </div>
        </Card>
    );
}

export default DeadlineCard;
