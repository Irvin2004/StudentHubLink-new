import { useEffect, useRef, useState } from "react";

import MessageComposer from "../../components/chat/MessageComposer/MessageComposer.jsx";
import MessageList from "../../components/chat/MessageList/MessageList.jsx";
import TypingIndicator from "../../components/chat/TypingIndicator/TypingIndicator.jsx";
import FileList from "../../components/files/FileList/FileList.jsx";
import FileUploader from "../../components/files/FileUploader/FileUploader.jsx";
import { canPostInChannel } from "../../config/channel-permissions.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useFiles } from "../../hooks/useFiles.js";
import { useMessages } from "../../hooks/useMessages.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./ChatPage.module.css";

export default function ChatPage({ channel, communityId, role }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [reply, setReply] = useState(null);
    const [view, setView] = useState("messages");
    const announcementRef = useRef(null);
    const {
        deleteFile,
        downloadFile,
        error: fileError,
        files,
        loading: filesLoading
    } = useFiles(channel?.id, { communityId });
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
        if (!fileError) return;
        showToast({
            title: "Files unavailable",
            message: fileError.message,
            type: "error"
        });
    }, [fileError, showToast]);

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

    async function handleDeleteFile(file) {
        if (
            !window.confirm(
                `Delete ${file.originalName}? This cannot be undone.`
            )
        ) {
            return;
        }
        try {
            await deleteFile(file);
            showToast({
                title: "File deleted",
                message: `${file.originalName} was removed.`,
                type: "success"
            });
        } catch (nextError) {
            showToast({
                title: "Could not delete file",
                message: nextError.message,
                type: "error"
            });
        }
    }

    return (
        <div className={styles.chat}>
            <nav aria-label="Channel content" className={styles.tabs}>
                <button
                    aria-current={view === "messages" ? "page" : undefined}
                    onClick={() => setView("messages")}
                    type="button"
                >
                    Messages
                </button>
                <button
                    aria-current={view === "files" ? "page" : undefined}
                    onClick={() => setView("files")}
                    type="button"
                >
                    Shared files
                    {files.length ? <span>{files.length}</span> : null}
                </button>
            </nav>
            <div className={styles.messages} hidden={view !== "messages"}>
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
                    channelId={channel.id}
                    channelName={channel.name}
                    communityId={communityId}
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
            <div className={styles.files} hidden={view !== "files"}>
                <FileUploader
                    channelId={channel.id}
                    communityId={communityId}
                />
                <FileList
                    currentUserId={user?.uid}
                    files={files}
                    loading={filesLoading}
                    onDelete={handleDeleteFile}
                    onDownload={downloadFile}
                    role={role}
                />
            </div>
            <p
                aria-live="polite"
                className={styles.srOnly}
                ref={announcementRef}
            />
        </div>
    );
}
