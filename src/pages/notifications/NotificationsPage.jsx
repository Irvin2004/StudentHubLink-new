import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Skeleton from "../../components/ui/Skeleton/index.js";
import { NOTIFICATION_TYPES } from "../../config/notification-types.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import { useSettings } from "../../hooks/useSettings.js";
import styles from "./NotificationsPage.module.css";

function toDate(value) {
    if (typeof value?.toDate === "function") return value.toDate();
    return new Date(value || Date.now());
}

function destination(item) {
    return (
        item.route ||
        (item.communityId && item.channelId
            ? `/community/${item.communityId}/channel/${item.channelId}`
            : "#")
    );
}

export default function NotificationsPage() {
    useDocumentTitle("StudentHub - Notifications", "react-app");
    const { loading, markAllRead, notifications, setRead, unreadCount } =
        useNotifications();
    const { settings, updateSettings } = useSettings();
    const [filter, setFilter] = useState("all");
    const deferredFilter = useDeferredValue(filter);
    const visible = useMemo(
        () =>
            notifications.filter((item) => {
                if (deferredFilter === "unread") return !item.read;
                if (deferredFilter === "mentions") {
                    return [
                        NOTIFICATION_TYPES.MENTION,
                        NOTIFICATION_TYPES.CHANNEL_MENTION
                    ].includes(item.type);
                }
                return true;
            }),
        [deferredFilter, notifications]
    );

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>STAY IN THE LOOP</p>
                    <h1>Notifications</h1>
                    <p>
                        {unreadCount
                            ? `${unreadCount} unread updates`
                            : "You’re all caught up"}
                    </p>
                </div>
                <button
                    disabled={!unreadCount}
                    onClick={markAllRead}
                    type="button"
                >
                    Mark all as read
                </button>
            </header>
            <nav aria-label="Notification filters" className={styles.filters}>
                {["all", "unread", "mentions"].map((item) => (
                    <button
                        aria-pressed={filter === item}
                        key={item}
                        onClick={() => setFilter(item)}
                        type="button"
                    >
                        {item[0].toUpperCase() + item.slice(1)}
                    </button>
                ))}
            </nav>
            <details className={styles.preferences}>
                <summary>Notification preferences</summary>
                <div>
                    {[
                        ["enabled", "In-app and toast notifications"],
                        ["groupMessages", "Community messages"],
                        ["mentions", "Mentions"],
                        ["reactions", "Reactions"]
                    ].map(([key, label]) => (
                        <label key={key}>
                            <span>{label}</span>
                            <input
                                checked={settings.notifications[key]}
                                onChange={(event) =>
                                    updateSettings({
                                        notifications: {
                                            ...settings.notifications,
                                            [key]: event.target.checked
                                        }
                                    })
                                }
                                type="checkbox"
                            />
                        </label>
                    ))}
                </div>
            </details>
            <section
                aria-busy={loading}
                aria-label="Notification centre"
                className={styles.list}
            >
                {loading ? (
                    <Skeleton count={5} height="5.5rem" />
                ) : visible.length ? (
                    visible.map((item) => (
                        <article
                            className={styles.item}
                            data-unread={!item.read || undefined}
                            key={item.id}
                        >
                            <span aria-hidden="true" className={styles.icon}>
                                {item.type.includes("mention")
                                    ? "@"
                                    : item.type === "new_file"
                                      ? "↥"
                                      : "•"}
                            </span>
                            <div>
                                <header>
                                    <strong>{item.title}</strong>
                                    <time>
                                        {toDate(
                                            item.createdAt
                                        ).toLocaleString()}
                                    </time>
                                </header>
                                <p>{item.message}</p>
                                <small>{item.senderName}</small>
                            </div>
                            <div className={styles.actions}>
                                {destination(item) !== "#" ? (
                                    <Link
                                        onClick={() => setRead(item.id, true)}
                                        to={destination(item)}
                                    >
                                        Open
                                    </Link>
                                ) : null}
                                <button
                                    onClick={() => setRead(item.id, !item.read)}
                                    type="button"
                                >
                                    Mark as {item.read ? "unread" : "read"}
                                </button>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className={styles.empty}>
                        <span aria-hidden="true">✓</span>
                        <h2>No notifications here</h2>
                        <p>
                            New messages, mentions, files and community activity
                            will appear here.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
