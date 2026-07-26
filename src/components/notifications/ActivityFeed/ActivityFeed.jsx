import { Link } from "react-router-dom";

import { LoadErrorState } from "../../common/LoadErrorState.jsx";
import Skeleton from "../../ui/Skeleton/index.js";
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
            <div
                aria-busy="true"
                aria-label="Loading community activity"
                role="status"
            >
                <Skeleton count={5} height="4.5rem" />
            </div>
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
                <div className={styles.empty}>
                    <h3>No recent activity</h3>
                    <p>Community events will appear as students participate.</p>
                </div>
            )}
        </section>
    );
}
