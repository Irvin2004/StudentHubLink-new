import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./RecentActivity.module.css";

const ACTIVITY_ICONS = {
    upload: "🕒",
    community: "👥",
    completed: "✅",
    task: "📝"
};

export function ActivityItem({ activity }) {
    const icon = ACTIVITY_ICONS[activity.type] ?? "🕒";

    return (
        <article className={styles.item}>
            <span aria-hidden="true" className={styles.icon}>
                {icon}
            </span>
            <div className={styles.copy}>
                <h3 className={styles.itemTitle}>{activity.title}</h3>
                <p className={styles.time}>{activity.time}</p>
            </div>
        </article>
    );
}

export function ActivityItemSkeleton() {
    return (
        <div className={styles.item}>
            <Skeleton className={styles.iconSkeleton} />
            <div className={styles.copy}>
                <Skeleton width="72%" />
                <Skeleton width="42%" />
            </div>
        </div>
    );
}
