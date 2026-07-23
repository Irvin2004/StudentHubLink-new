"use strict";

const REPLY_TYPES = Object.freeze({
    TEXT: "text",
    IMAGE: "image",
    FILE: "file",
    VOICE: "voice"
});

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeReplyTarget(message) {
    if (!message || typeof message !== "object") {
        return null;
    }

    const type = Object.values(REPLY_TYPES).includes(message.type)
        ? message.type
        : REPLY_TYPES.TEXT;
    let preview = normalizeText(message.preview);

    if (message.deletedAt || message.deleted === true) {
        preview = "Deleted message";
    } else if (type === REPLY_TYPES.IMAGE) {
        preview = "Photo";
    } else if (type === REPLY_TYPES.FILE) {
        preview = preview || normalizeText(message.fileName) || "File";
    } else if (type === REPLY_TYPES.VOICE) {
        preview = "Voice message";
    } else {
        preview = preview || normalizeText(message.text) || "Message";
    }

    return {
        messageId: normalizeText(message.messageId || message.id),
        senderId: normalizeText(message.senderId),
        senderName: normalizeText(message.senderName) || "Student",
        preview,
        type
    };
}

function getDisplayPreview(replyTarget) {
    switch (replyTarget.type) {
        case REPLY_TYPES.IMAGE:
            return `🖼 ${replyTarget.preview}`;
        case REPLY_TYPES.FILE:
            return `📎 ${replyTarget.preview}`;
        case REPLY_TYPES.VOICE:
            return `🎤 ${replyTarget.preview}`;
        default:
            return replyTarget.preview;
    }
}

export function createReplyComposer({
    container,
    onCancel = () => {}
} = {}) {
    if (!container?.ownerDocument?.createElement) {
        throw new Error("Reply composer container is required.");
    }

    const documentReference = container.ownerDocument;
    let currentReplyTarget = null;

    const header = documentReference.createElement("p");
    header.className = "reply-composer__header";

    const sender = documentReference.createElement("span");
    sender.className = "reply-composer__sender";

    const preview = documentReference.createElement("p");
    preview.className = "reply-composer__preview";

    const cancelButton = documentReference.createElement("button");
    cancelButton.className = "reply-composer__cancel";
    cancelButton.type = "button";
    cancelButton.setAttribute("aria-label", "Cancel reply");
    cancelButton.textContent = "✕";

    header.append("↩ Replying to ", sender);
    container.replaceChildren(header, preview, cancelButton);
    container.classList.add("reply-composer");
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    container.hidden = true;

    function clearReplyTarget() {
        currentReplyTarget = null;
        sender.textContent = "";
        preview.textContent = "";
        container.hidden = true;
    }

    function setReplyTarget(message) {
        const replyTarget = normalizeReplyTarget(message);

        if (!replyTarget) {
            clearReplyTarget();
            return;
        }

        currentReplyTarget = replyTarget;
        sender.textContent = replyTarget.senderName;
        preview.textContent = getDisplayPreview(replyTarget);
        container.hidden = false;
    }

    function getReplyTarget() {
        return currentReplyTarget
            ? { ...currentReplyTarget }
            : null;
    }

    function handleCancel() {
        if (!currentReplyTarget) {
            return;
        }

        clearReplyTarget();
        onCancel();
    }

    function destroy() {
        cancelButton.removeEventListener("click", handleCancel);
        clearReplyTarget();
        container.replaceChildren();
        container.classList.remove("reply-composer");
        container.removeAttribute("role");
        container.removeAttribute("aria-live");
        container.removeAttribute("aria-atomic");
    }

    cancelButton.addEventListener("click", handleCancel);

    return {
        setReplyTarget,
        clearReplyTarget,
        getReplyTarget,
        destroy
    };
}
