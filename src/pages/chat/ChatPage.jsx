import { useEffect, useRef, useState } from "react";

import MessageComposer from "../../components/chat/MessageComposer/MessageComposer.jsx";
import MessageList from "../../components/chat/MessageList/MessageList.jsx";
import TypingIndicator from "../../components/chat/TypingIndicator/TypingIndicator.jsx";
import { canPostInChannel } from "../../config/channel-permissions.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useMessages } from "../../hooks/useMessages.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./ChatPage.module.css";

export default function ChatPage({ channel, communityId, role }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [reply, setReply] = useState(null);
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
        sendMessage,
        toggleReaction,
        typingUsers
    } = useMessages(channel?.id, { communityId });

    useEffect(() => {
        if (!error) return;
        showToast({
            title: "Messaging unavailable",
            message: error.message,
            type: "error"
        });
    }, [error, showToast]);

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

    if (!channel || !communityId) {
        return (
            <div className={styles.unavailable}>
                <h1>Open a community channel</h1>
                <p>Choose a channel to join its conversation.</p>
            </div>
        );
    }

    async function handleSend(text, options) {
        await sendMessage(text, options);
        clearTyping();
    }

    return (
        <div className={styles.chat}>
            <MessageList
                currentUserId={user?.uid}
                hasOlder={hasOlder}
                loading={loading}
                loadingOlder={loadingOlder}
                messages={messages}
                onDelete={deleteMessage}
                onEdit={editMessage}
                onLoadOlder={loadOlder}
                onReact={toggleReaction}
                onReply={setReply}
                role={role}
            />
            <TypingIndicator users={typingUsers} />
            <MessageComposer
                canPost={canPostInChannel(role, channel)}
                channelName={channel.name}
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
            <p
                aria-live="polite"
                className={styles.srOnly}
                ref={announcementRef}
            />
        </div>
    );
}
