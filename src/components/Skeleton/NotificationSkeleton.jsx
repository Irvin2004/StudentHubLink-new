import Skeleton from "./Skeleton.jsx";
import styles from "./Skeleton.module.css";

export default function NotificationSkeleton({
    count = 5,
    label = "Loading notifications"
}) {
    return (
        <div
            aria-busy="true"
            aria-label={label}
            className={styles.notificationList}
            role="status"
        >
            <span className="sr-only">{label}</span>
            {Array.from({ length: count }, (_, index) => (
                <article
                    aria-hidden="true"
                    className={styles.notificationRow}
                    key={index}
                >
                    <Skeleton
                        height="2.75rem"
                        variant="circle"
                        width="2.75rem"
                    />
                    <div>
                        <Skeleton
                            height="0.85rem"
                            width={index % 2 ? "58%" : "72%"}
                        />
                        <Skeleton height="0.75rem" width="88%" />
                        <Skeleton height="0.65rem" width="35%" />
                    </div>
                    <Skeleton height="2.4rem" width="5rem" />
                </article>
            ))}
        </div>
    );
}
