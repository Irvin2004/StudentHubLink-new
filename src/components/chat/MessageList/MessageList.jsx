import { useEffect, useRef } from "react";

import DateDivider from "../DateDivider/DateDivider.jsx";
import MessageItem from "../MessageItem/MessageItem.jsx";
import Skeleton from "../../ui/Skeleton/index.js";
import { groupMessagesByDate } from "../../../utils/message-formatter.js";
import styles from "./MessageList.module.css";

function MessageListSkeleton() {
    return (
        <div aria-label="Loading messages" className={styles.skeleton}>
            {[82, 64, 76, 55].map((width) => (
                <div key={width}>
                    <Skeleton height="2.5rem" variant="circle" width="2.5rem" />
                    <span>
                        <Skeleton height="0.8rem" width={`${width / 4}rem`} />
                        <Skeleton height="0.8rem" width={`${width}%`} />
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function MessageList({
    currentUserId,
    hasOlder,
    loading,
    loadingOlder,
    messages,
    onDelete,
    onEdit,
    onLoadOlder,
    onReact,
    onReply,
    role
}) {
    const containerRef = useRef(null);
    const previousNewestIdRef = useRef(null);
    const groups = groupMessagesByDate(messages);

    useEffect(() => {
        const container = containerRef.current;
        const newestId = messages.at(-1)?.id;
        if (!container || !newestId) return;

        const isNearBottom =
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
            140;
        const firstLoad = previousNewestIdRef.current === null;

        if (firstLoad || isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
        previousNewestIdRef.current = newestId;
    }, [messages]);

    async function handleScroll(event) {
        if (event.currentTarget.scrollTop > 48 || !hasOlder || loadingOlder) {
            return;
        }

        const container = event.currentTarget;
        const previousHeight = container.scrollHeight;
        await onLoadOlder();
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - previousHeight;
        });
    }

    if (loading) return <MessageListSkeleton />;

    return (
        <div
            aria-label="Channel messages"
            className={styles.list}
            onScroll={handleScroll}
            ref={containerRef}
            role="log"
            tabIndex="0"
        >
            {loadingOlder ? (
                <p className={styles.historyStatus} role="status">
                    Loading earlier messages…
                </p>
            ) : null}
            {!messages.length ? (
                <div className={styles.empty}>
                    <span aria-hidden="true">#</span>
                    <h2>Start the conversation</h2>
                    <p>
                        This channel is ready. Share a question, update, or
                        resource with your community.
                    </p>
                </div>
            ) : (
                groups.map((group) => (
                    <section aria-label={group.label} key={group.key}>
                        <DateDivider label={group.label} />
                        {group.messages.map((message) => (
                            <MessageItem
                                currentUserId={currentUserId}
                                key={message.id}
                                message={message}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onReact={onReact}
                                onReply={onReply}
                                role={role}
                            />
                        ))}
                    </section>
                ))
            )}
        </div>
    );
}
