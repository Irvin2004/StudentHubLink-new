import { useRef, useState } from "react";

import UploadProgress from "../../files/UploadProgress/UploadProgress.jsx";
import AttachmentPreview from "../AttachmentPreview/AttachmentPreview.jsx";
import MessageInput from "../MessageInput/MessageInput.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import { MESSAGE_MAX_LENGTH } from "../../../config/message-types.js";
import { useFiles } from "../../../hooks/useFiles.js";
import styles from "./MessageComposer.module.css";

export default function MessageComposer({
    canPost = true,
    channelId,
    channelName,
    communityId,
    inputId,
    onCancelReply,
    onSend,
    onTyping,
    reply
}) {
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const { cancelUpload, removeUpload, retryUpload, uploadFiles, uploads } =
        useFiles(channelId, { communityId, subscribe: false });
    const uploading = uploads.some((upload) => upload.status === "uploading");
    const cleanText = text.trim();
    const canSend =
        canPost &&
        !sending &&
        !uploading &&
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
            uploads
                .filter((upload) => upload.status === "complete")
                .forEach((upload) => removeUpload(upload.id));
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

    async function handleFiles(files) {
        const remaining = Math.max(0, 5 - attachments.length);
        if (!remaining) {
            setSendError("A message can include up to 5 attachments.");
            return;
        }

        setSendError("");
        const results = await uploadFiles(
            Array.from(files || []).slice(0, remaining)
        );
        const completed = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);
        const failure = results.find((result) => result.status === "rejected");

        if (completed.length) {
            setAttachments((current) => [...current, ...completed].slice(0, 5));
        }
        if (failure) {
            setSendError(
                failure.reason?.message ||
                    "An attachment could not be uploaded."
            );
        }
    }

    return (
        <div
            className={styles.wrapper}
            data-dragging={dragging || undefined}
            onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setDragging(false);
                }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (canPost) void handleFiles(event.dataTransfer.files);
            }}
        >
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
            {uploads.length ? (
                <div className={styles.uploads}>
                    {uploads.map((upload) => (
                        <UploadProgress
                            key={upload.id}
                            onCancel={cancelUpload}
                            onRemove={removeUpload}
                            onRetry={retryUpload}
                            upload={upload}
                        />
                    ))}
                </div>
            ) : null}
            {dragging ? (
                <p className={styles.dropHint}>Drop files to attach</p>
            ) : null}
            <div
                className={styles.composer}
                data-disabled={!canPost || undefined}
            >
                <input
                    aria-label="Choose attachments"
                    className={styles.fileInput}
                    multiple
                    onChange={(event) => {
                        void handleFiles(event.target.files);
                        event.target.value = "";
                    }}
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
                    id={inputId}
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
