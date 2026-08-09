import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import { LoadErrorState } from "../../../../components/common/LoadErrorState.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import { ActivityItem, ActivityItemSkeleton } from "./ActivityItem.jsx";
import styles from "./RecentActivity.module.css";

const activities = [
    {
        id: "1",
        type: "upload",
        title: "Uploaded Robotics Notes",
        time: "2 hours ago"
    },
    {
        id: "2",
        type: "community",
        title: "Joined Programming Community",
        time: "Yesterday"
    },
    {
        id: "3",
        type: "completed",
        title: "Completed Python Quiz",
        time: "2 days ago"
    }
];

export function RecentActivity({
    activities: activityItems,
    activity,
    error,
    loading,
    onRetry
}) {
    const recentActivities = activityItems ?? activity ?? activities;

    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <Skeleton width="36%" />
                <div className={styles.list}>
                    <ActivityItemSkeleton />
                    <ActivityItemSkeleton />
                    <ActivityItemSkeleton />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.card}>
                <LoadErrorState
                    onRetry={onRetry}
                    title="Activity unavailable"
                />
            </section>
        );
    }

    if (!recentActivities.length) {
        return (
            <section className={styles.card}>
                <EmptyState
                    description="Recent uploads, communities, and completed work will appear here."
                    icon="🕒"
                    title="Nothing recent yet"
                />
            </section>
        );
    }

    return (
        <Card as="section" aria-label="Recent Activity" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>Recent Activity</h2>
            </header>
            <div className={styles.list}>
                {recentActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                ))}
            </div>
        </Card>
    );
}

export default RecentActivity;
