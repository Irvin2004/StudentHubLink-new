import { Link } from "react-router-dom";

import { LoadErrorState } from "../../common/LoadErrorState.jsx";
import EmptyState from "../../EmptyState/EmptyState.jsx";
import NotificationSkeleton from "../../Skeleton/NotificationSkeleton.jsx";
import { ACTIVITY_TYPES } from "../../../config/activity-types.js";
import styles from "./ActivityFeed.module.css";

const ACTIVITY_MARKS = Object.freeze({
    [ACTIVITY_TYPES.ANNOUNCEMENT_POSTED]: "!",
    [ACTIVITY_TYPES.CHANNEL_CREATED]: "#",
    [ACTIVITY_TYPES.FILE_UPLOADED]: "↑",
    [ACTIVITY_TYPES.MEMBER_JOINED]: "+"
});

function date(value) {
    const result =
        typeof value?.toDate === "function"
            ? value.toDate()
            : new Date(value || Date.now());
    return result.toLocaleString();
}

export default function ActivityFeed({ activities, error, loading }) {
    if (loading) {
        return (
            <NotificationSkeleton
                count={4}
                label="Loading community activity"
            />
        );
    }
    if (error && !activities.length) {
        return (
            <LoadErrorState
                description="We could not load recent community activity."
                title="Activity unavailable"
            />
        );
    }

    return (
        <section aria-label="Community activity feed" className={styles.feed}>
            <header>
                <h2>Community activity</h2>
                <p>Recent members, files, channels and announcements.</p>
            </header>
            {activities.length ? (
                <ol>
                    {activities.map((item) => (
                        <li data-type={item.type} key={item.id}>
                            <span aria-hidden="true">
                                {ACTIVITY_MARKS[item.type] || "•"}
                            </span>
                            <div>
                                <strong>{item.title}</strong>
                                <p>{item.description}</p>
                                <time>{date(item.createdAt)}</time>
                                {item.communityId && item.channelId ? (
                                    <Link
                                        to={`/community/${item.communityId}/channel/${item.channelId}`}
                                    >
                                        Open channel
                                    </Link>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <EmptyState
                    description="Community events will appear as students participate."
                    icon="✦"
                    title="No recent activity"
                />
            )}
        </section>
    );
}
