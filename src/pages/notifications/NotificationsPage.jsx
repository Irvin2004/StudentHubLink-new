import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import NotificationSkeleton from "../../components/Skeleton/NotificationSkeleton.jsx";
import { ANALYTICS_EVENTS } from "../../config/analytics-events.js";
import { NOTIFICATION_TYPES } from "../../config/notification-types.js";
import { useAnalytics } from "../../hooks/useAnalytics.js";
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
    const { track } = useAnalytics();
    const {
        error,
        hasMoreNotifications,
        loadOlder,
        loading,
        loadingOlderNotifications,
        markAllRead,
        notifications,
        retryNotifications,
        setRead,
        unreadCount
    } = useNotifications();
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

    function openNotification(item) {
        track(ANALYTICS_EVENTS.NOTIFICATION_OPENED, {
            notificationId: item.id,
            notificationType: item.type
        });
        setRead(item.id, true);
    }

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
                    aria-label={`Mark all ${unreadCount} unread notifications as read`}
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
                    <NotificationSkeleton />
                ) : error && !notifications.length ? (
                    <LoadErrorState
                        description="We could not load your notifications."
                        onRetry={retryNotifications}
                        title="Notifications unavailable"
                    />
                ) : visible.length ? (
                    <>
                        {error ? (
                            <div className={styles.inlineError} role="alert">
                                <span>
                                    Some notification updates could not be
                                    loaded.
                                </span>
                                <button
                                    onClick={retryNotifications}
                                    type="button"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : null}
                        {visible.map((item) => (
                            <article
                                className={styles.item}
                                data-unread={!item.read || undefined}
                                key={item.id}
                            >
                                <span
                                    aria-hidden="true"
                                    className={styles.icon}
                                >
                                    {item.type.includes("mention")
                                        ? "@"
                                        : item.type === "new_file"
                                          ? "↥"
                                          : "•"}
                                </span>
                                <button
                                    aria-label={`${item.read ? "Read" : "Unread"} notification: ${item.title}`}
                                    className={styles.content}
                                    onClick={() => openNotification(item)}
                                    type="button"
                                >
                                    {!item.read ? (
                                        <span className="sr-only">
                                            Unread.{" "}
                                        </span>
                                    ) : null}
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
                                </button>
                                <div className={styles.actions}>
                                    {destination(item) !== "#" ? (
                                        <Link
                                            onClick={() =>
                                                openNotification(item)
                                            }
                                            to={destination(item)}
                                        >
                                            Open
                                        </Link>
                                    ) : null}
                                    <button
                                        aria-label={`Mark ${item.title} as ${item.read ? "unread" : "read"}`}
                                        onClick={() =>
                                            setRead(item.id, !item.read)
                                        }
                                        type="button"
                                    >
                                        Mark as {item.read ? "unread" : "read"}
                                    </button>
                                </div>
                            </article>
                        ))}
                        {hasMoreNotifications ? (
                            <button
                                aria-busy={loadingOlderNotifications}
                                className={styles.loadOlder}
                                disabled={loadingOlderNotifications}
                                onClick={() => void loadOlder()}
                                type="button"
                            >
                                {loadingOlderNotifications
                                    ? "Loading older notifications…"
                                    : "Load older notifications"}
                            </button>
                        ) : null}
                    </>
                ) : (
                    <>
                        <EmptyState
                            description={
                                filter === "all"
                                    ? "You don't have any notifications yet."
                                    : "No notifications match this filter."
                            }
                            illustration="notifications"
                            title="You're all caught up"
                        />
                        {hasMoreNotifications ? (
                            <button
                                aria-busy={loadingOlderNotifications}
                                className={styles.loadOlder}
                                disabled={loadingOlderNotifications}
                                onClick={() => void loadOlder()}
                                type="button"
                            >
                                {loadingOlderNotifications
                                    ? "Loading older notifications…"
                                    : "Load older notifications"}
                            </button>
                        ) : null}
                    </>
                )}
            </section>
        </main>
    );
}
