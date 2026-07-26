import { useEffect, useMemo, useRef } from "react";

import DateDivider from "../DateDivider/DateDivider.jsx";
import MessageItem from "../MessageItem/MessageItem.jsx";
import PinnedMessages from "../PinnedMessages/PinnedMessages.jsx";
import { LoadErrorState } from "../../common/LoadErrorState.jsx";
import EmptyState from "../../EmptyState/EmptyState.jsx";
import ChatMessageSkeleton from "../../Skeleton/ChatMessageSkeleton.jsx";
import { groupMessagesByDate } from "../../../utils/message-formatter.js";
import styles from "./MessageList.module.css";

export default function MessageList({
    currentUserId,
    error,
    hasOlder,
    loading,
    loadingOlder,
    messages,
    onDelete,
    onEdit,
    onLoadOlder,
    onReact,
    onReply,
    onRetry,
    onStartConversation,
    onTogglePin,
    role
}) {
    const containerRef = useRef(null);
    const previousNewestIdRef = useRef(null);
    const { groups, pinnedMessages } = useMemo(
        () => ({
            groups: groupMessagesByDate(messages),
            pinnedMessages: messages.filter(
                (message) => message.pinnedAt && !message.deleted
            )
        }),
        [messages]
    );

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

    if (loading) return <ChatMessageSkeleton />;
    if (error && !messages.length) {
        return (
            <LoadErrorState
                description="We could not load this channel's messages."
                title="Messages unavailable"
            />
        );
    }

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
            <PinnedMessages messages={pinnedMessages} />
            {!messages.length ? (
                <EmptyState
                    actionLabel={
                        onStartConversation ? "Send message" : undefined
                    }
                    description="Start the conversation and send the first message."
                    icon="💬"
                    onAction={onStartConversation}
                    title="No messages yet"
                />
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
                                onPin={onTogglePin}
                                onReact={onReact}
                                onReply={onReply}
                                onRetry={onRetry}
                                role={role}
                            />
                        ))}
                    </section>
                ))
            )}
        </div>
    );
}
