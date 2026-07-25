import { useRef, useState } from "react";

import AttachmentPreview from "../AttachmentPreview/AttachmentPreview.jsx";
import MessageInput from "../MessageInput/MessageInput.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import { MESSAGE_MAX_LENGTH } from "../../../config/message-types.js";
import styles from "./MessageComposer.module.css";

export default function MessageComposer({
    canPost = true,
    channelName,
    onCancelReply,
    onSend,
    onTyping,
    reply
}) {
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const cleanText = text.trim();
    const canSend =
        canPost &&
        !sending &&
        (Boolean(cleanText) || attachments.length > 0) &&
        text.length <= MESSAGE_MAX_LENGTH;

    async function handleSend() {
        if (!canSend) return;

        setSending(true);
        setSendError("");
        try {
            await onSend(cleanText, { attachments, replyTo: reply });
            setText("");
            setAttachments([]);
            onCancelReply?.();
            inputRef.current?.focus();
        } catch (error) {
            setSendError(error.message || "Message could not be sent.");
        } finally {
            setSending(false);
        }
    }

    function handleChange(event) {
        setText(event.target.value);
        onTyping?.();
    }

    function handleFiles(event) {
        const files = Array.from(event.target.files || []).map((file) => ({
            id: `${file.name}-${file.lastModified}`,
            name: file.name,
            size: file.size,
            type: file.type
        }));
        setAttachments((current) => [...current, ...files].slice(0, 5));
        event.target.value = "";
    }

    return (
        <div className={styles.wrapper}>
            <ReplyPreview onClose={onCancelReply} reply={reply} />
            <AttachmentPreview
                attachments={attachments}
                onRemove={(index) =>
                    setAttachments((current) =>
                        current.filter(
                            (_item, itemIndex) => itemIndex !== index
                        )
                    )
                }
            />
            <div
                className={styles.composer}
                data-disabled={!canPost || undefined}
            >
                <input
                    aria-label="Choose attachments"
                    className={styles.fileInput}
                    multiple
                    onChange={handleFiles}
                    ref={fileRef}
                    type="file"
                />
                <button
                    aria-label="Add attachment"
                    className={styles.attach}
                    disabled={!canPost || sending}
                    onClick={() => fileRef.current?.click()}
                    type="button"
                >
                    <span aria-hidden="true">＋</span>
                </button>
                <MessageInput
                    aria-label={`Message ${channelName}`}
                    disabled={!canPost || sending}
                    maxLength={MESSAGE_MAX_LENGTH}
                    onChange={handleChange}
                    onSend={handleSend}
                    placeholder={
                        canPost
                            ? `Message #${channelName}`
                            : "Only admins can post in this channel"
                    }
                    ref={inputRef}
                    value={text}
                />
                <span
                    className={styles.counter}
                    data-warning={
                        text.length > MESSAGE_MAX_LENGTH * 0.9 || undefined
                    }
                >
                    {text.length}/{MESSAGE_MAX_LENGTH}
                </span>
                <button
                    className={styles.send}
                    disabled={!canSend}
                    onClick={handleSend}
                    type="button"
                >
                    {sending ? "Sending…" : "Send"}
                </button>
            </div>
            <p className={styles.hint}>
                Enter to send · Shift + Enter for a new line
            </p>
            {sendError ? (
                <p className={styles.error} role="alert">
                    {sendError}
                </p>
            ) : null}
        </div>
    );
}
