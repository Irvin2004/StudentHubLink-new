import Skeleton from "../../ui/Skeleton/index.js";
import styles from "./ActivityFeed.module.css";

function date(value) {
    const result =
        typeof value?.toDate === "function"
            ? value.toDate()
            : new Date(value || Date.now());
    return result.toLocaleString();
}

export default function ActivityFeed({ activities, loading }) {
    if (loading) return <Skeleton count={5} height="4.5rem" />;
    return (
        <section aria-label="Community activity feed" className={styles.feed}>
            <header>
                <h2>Community activity</h2>
                <p>Recent messages, files and channel updates.</p>
            </header>
            {activities.length ? (
                <ol>
                    {activities.map((item) => (
                        <li key={item.id}>
                            <span aria-hidden="true" />
                            <div>
                                <strong>{item.title}</strong>
                                <p>{item.description}</p>
                                <time>{date(item.createdAt)}</time>
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
