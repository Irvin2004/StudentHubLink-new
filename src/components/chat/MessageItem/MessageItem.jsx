import { memo, useState } from "react";

import Avatar from "../../ui/Avatar/index.js";
import AttachmentPreview from "../AttachmentPreview/AttachmentPreview.jsx";
import MessageContextMenu from "../MessageContextMenu/MessageContextMenu.jsx";
import MessageReactions from "../MessageReactions/MessageReactions.jsx";
import MessageStatus from "../MessageStatus/MessageStatus.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import {
    canDeleteCommunityMessage,
    canPinCommunityMessage
} from "../../../config/community-permissions.js";
import { formatMessageTime } from "../../../utils/message-formatter.js";
import styles from "./MessageItem.module.css";

function MessageItem({
    currentUserId,
    message,
    onDelete,
    onEdit,
    onPin,
    onReact,
    onReply,
    onRetry,
    role
}) {
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);
    const [saving, setSaving] = useState(false);
    const isAuthor = message.senderId === currentUserId;
    const canDelete = canDeleteCommunityMessage(message, currentUserId, role);
    const canPin = canPinCommunityMessage(role);

    async function saveEdit() {
        const text = editText.trim();
        if (!text || text === message.text) {
            setEditing(false);
            setEditText(message.text);
            return;
        }

        setSaving(true);
        try {
            await onEdit(message.id, text);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    async function copyMessage() {
        await navigator.clipboard.writeText(message.text);
    }

    return (
        <article
            aria-label={`Message from ${message.senderName}`}
            className={`${styles.item} message-row`}
            data-deleted={message.deleted || undefined}
            id={`message-${message.id}`}
            tabIndex="-1"
        >
            <Avatar
                className={styles.avatar}
                name={message.senderName}
                size="medium"
                src={message.senderPhotoURL}
            />
            <div className={styles.body}>
                <header className={styles.meta}>
                    <strong>{message.senderName}</strong>
                    <time>
                        {formatMessageTime(message.createdAt)}
                        {message.edited && !message.deleted ? " (edited)" : ""}
                    </time>
                    {message.pinnedAt ? (
                        <span className={styles.pinned}>📌 Pinned</span>
                    ) : null}
                    {isAuthor ? (
                        <MessageStatus
                            onRetry={() => onRetry(message.id)}
                            status={message.deliveryStatus}
                        />
                    ) : null}
                </header>
                {message.deleted ? (
                    <p className={styles.deleted}>This message was deleted.</p>
                ) : (
                    <>
                        <ReplyPreview compact reply={message.replyTo} />
                        {editing ? (
                            <div className={styles.editor}>
                                <textarea
                                    aria-label="Edit message"
                                    autoFocus
                                    onChange={(event) =>
                                        setEditText(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" &&
                                            !event.shiftKey
                                        ) {
                                            event.preventDefault();
                                            void saveEdit();
                                        }
                                        if (event.key === "Escape") {
                                            setEditing(false);
                                            setEditText(message.text);
                                        }
                                    }}
                                    value={editText}
                                />
                                <div>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setEditText(message.text);
                                        }}
                                        type="button"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={saving || !editText.trim()}
                                        onClick={saveEdit}
                                        type="button"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className={styles.text}>{message.text}</p>
                        )}
                        <AttachmentPreview attachments={message.attachments} />
                        <MessageReactions
                            currentUserId={currentUserId}
                            message={message}
                            onToggle={(reaction) => onReact(message, reaction)}
                        />
                    </>
                )}
            </div>
            {!message.deleted ? (
                <MessageContextMenu
                    canDelete={canDelete}
                    canEdit={isAuthor}
                    canPin={canPin}
                    isPinned={Boolean(message.pinnedAt)}
                    onCopy={copyMessage}
                    onDelete={() => onDelete(message.id)}
                    onEdit={() => setEditing(true)}
                    onPin={() => onPin(message)}
                    onReact={(reaction) => onReact(message, reaction)}
                    onReply={() => onReply(message)}
                />
            ) : null}
        </article>
    );
}

export default memo(MessageItem);
