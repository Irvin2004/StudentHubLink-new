import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import MessageComposer from "../../components/chat/MessageComposer/MessageComposer.jsx";
import MessageList from "../../components/chat/MessageList/MessageList.jsx";
import TypingIndicator from "../../components/chat/TypingIndicator/TypingIndicator.jsx";
import ChatMessageSkeleton from "../../components/Skeleton/ChatMessageSkeleton.jsx";
import { canPostInChannel } from "../../config/channel-permissions.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useMessages } from "../../hooks/useMessages.js";
import { useObservability } from "../../hooks/useObservability.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./ChatPage.module.css";

const ChatActivityView = lazy(
    () => import("../../components/chat/ChatActivityView/ChatActivityView.jsx")
);
const ChatFilesView = lazy(
    () => import("../../components/chat/ChatFilesView/ChatFilesView.jsx")
);

function TabLoadingState() {
    return <ChatMessageSkeleton count={3} />;
}

export default function ChatPage({ channel, communityId, role }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { captureError, getActionableErrorMessage } = useObservability();
    const [reply, setReply] = useState(null);
    const requestedView = searchParams.get("view");
    const view = ["activity", "files", "messages"].includes(requestedView)
        ? requestedView
        : "messages";
    const canPost = canPostInChannel(role, channel);
    const announcementRef = useRef(null);
    const {
        clearTyping,
        deleteMessage,
        editMessage,
        error,
        hasOlder,
        loadOlder,
        loading,
        loadingOlder,
        messages,
        notifyTyping,
        retryMessage,
        sendMessage,
        togglePin,
        toggleReaction,
        typingUsers
    } = useMessages(channel?.id, {
        communityId,
        enabled: view === "messages"
    });

    useEffect(() => {
        if (!error) return;
        captureError(error, { feature: "channel_messages" });
        showToast({
            title: "Messaging unavailable",
            message: getActionableErrorMessage(error, "messages"),
            type: "error"
        });
    }, [captureError, error, getActionableErrorMessage, showToast]);

    useEffect(() => {
        const latest = messages.at(-1);
        if (
            latest &&
            latest.senderId !== user?.uid &&
            announcementRef.current
        ) {
            announcementRef.current.textContent = `New message from ${latest.senderName}: ${latest.deleted ? "This message was deleted." : latest.text}`;
        }
    }, [messages, user?.uid]);

    function selectView(nextView) {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                if (nextView === "messages") next.delete("view");
                else next.set("view", nextView);
                return next;
            },
            { replace: true }
        );
    }

    if (!channel || !communityId) {
        return (
            <div className={styles.unavailable}>
                <h1>Open a community channel</h1>
                <p>Choose a channel to join its conversation.</p>
            </div>
        );
    }

    async function handleSend(text, options) {
        await sendMessage(text, {
            ...options,
            channelType: channel.type
        });
        clearTyping();
    }

    return (
        <div className={styles.chat}>
            <nav aria-label="Channel content" className={styles.tabs}>
                <button
                    aria-current={view === "messages" ? "page" : undefined}
                    onClick={() => selectView("messages")}
                    type="button"
                >
                    Messages
                </button>
                <button
                    aria-current={view === "activity" ? "page" : undefined}
                    onClick={() => selectView("activity")}
                    type="button"
                >
                    Activity
                </button>
                <button
                    aria-current={view === "files" ? "page" : undefined}
                    onClick={() => selectView("files")}
                    type="button"
                >
                    Shared files
                </button>
            </nav>
            <div className={styles.messages} hidden={view !== "messages"}>
                <MessageList
                    currentUserId={user?.uid}
                    hasOlder={hasOlder}
                    loading={loading}
                    loadingOlder={loadingOlder}
                    messages={messages}
                    error={error}
                    onDelete={deleteMessage}
                    onEdit={editMessage}
                    onLoadOlder={loadOlder}
                    onReact={toggleReaction}
                    onReply={setReply}
                    onRetry={retryMessage}
                    onStartConversation={
                        canPost
                            ? () =>
                                  document
                                      .getElementById("channel-message-input")
                                      ?.focus()
                            : undefined
                    }
                    onTogglePin={togglePin}
                    role={role}
                />
                <TypingIndicator users={typingUsers} />
                <MessageComposer
                    canPost={canPost}
                    channelId={channel.id}
                    channelName={channel.name}
                    communityId={communityId}
                    inputId="channel-message-input"
                    onCancelReply={() => setReply(null)}
                    onSend={handleSend}
                    onTyping={notifyTyping}
                    reply={
                        reply
                            ? {
                                  id: reply.id,
                                  senderId: reply.senderId,
                                  senderName: reply.senderName,
                                  text: reply.text
                              }
                            : null
                    }
                />
            </div>
            {view === "files" ? (
                <Suspense fallback={<TabLoadingState />}>
                    <ChatFilesView
                        channelId={channel.id}
                        communityId={communityId}
                        role={role}
                    />
                </Suspense>
            ) : null}
            {view === "activity" ? (
                <Suspense fallback={<TabLoadingState />}>
                    <ChatActivityView communityId={communityId} />
                </Suspense>
            ) : null}
            <p
                aria-live="polite"
                className={styles.srOnly}
                ref={announcementRef}
            />
        </div>
    );
}
