import { auth } from "../firebase.js";
import {
    getConversationById,
    getUserProfile
} from "../services/conversation-service.js";
import {
    copyMessage,
    createMessageId,
    deleteMessageForEveryone,
    deleteMessageForMe,
    editMessage,
    MESSAGE_TYPES,
    sendMessage,
    startReply,
    subscribeToMessages
} from "../services/message-service.js";
import {
    setTypingStatus,
    subscribeToTypingStatus
} from "../services/presence-service.js";
import {
    uploadChatAttachment
} from "../services/storage-service.js?security=1";
import { renderMessages } from "../renderers/message-renderer.js?messaging=20";
import { getTypingIndicatorText } from "../components/typing-indicator.js";
import { getStudyGroup } from "../services/group-service.js?security=1";
import { openImageViewer } from "../components/image-viewer.js";
import {
    hideMessageMenu,
    showMessageMenu
} from "../components/message-menu.js?messaging=15";
import { initializeReactions } from "./reaction-controller.js?reactions=1";
import {
    initializeReadReceipts
} from "./read-receipt-controller.js?receipts=2";
import {
    openDeleteMessageDialog
} from "../components/delete-message-dialog.js?messaging=15";

import { handleError } from "../utils/error-handler.js?security=1";
import { validateAttachment } from "../utils/file-validator.js?security=1";
import { showToast } from "../utils/toast.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const params =
new URLSearchParams(window.location.search);

const conversationId =
params.get("id");

const targetMessageId =
params.get("message");

let targetMessageLocated = false;

const messageList =
document.getElementById("messageList");

const messageForm =
document.getElementById("messageForm");

const messageInput =
document.getElementById("messageInput");

const attachButton =
document.getElementById("attachButton");

const attachmentInput =
document.getElementById("attachmentInput");

const uploadProgressContainer =
document.getElementById("uploadProgressContainer");

const uploadProgressBar =
document.getElementById("uploadProgressBar");

const replyPreview =
document.getElementById("replyPreview");

const replySender =
document.getElementById("replySender");

const replyText =
document.getElementById("replyText");

const cancelReply =
document.getElementById("cancelReply");

let unsubscribeMessages =
null;

let unsubscribeTyping =
null;

let typingTimer =
null;

let latestMessages = [];
let pendingMessages = [];
let activeReceiverId = null;
let activeConversation = null;
let currentChatUser = null;
let attachmentUploading = false;
let activeOtherUserName = "Student";
let replyingTo = null;
let selectedMessage = null;
let reactionController = null;
let readReceiptController = null;

function clearReply() {
    replyingTo = null;
    replyPreview?.classList.add("hidden");

    if (replySender) replySender.textContent = "";
    if (replyText) replyText.textContent = "";
}

function getReplySenderName(message) {
    if (message.senderName) {
        return message.senderName;
    }

    return message.senderId === currentChatUser?.uid
        ? "You"
        : activeOtherUserName;
}

function getMessageById(messageId) {
    return [...latestMessages, ...pendingMessages]
        .find((message) => message.id === messageId);
}

function openReply(message) {
    if (!replyPreview || !replySender || !replyText) {
        return;
    }

    replyingTo = startReply({
        ...message,
        senderName: getReplySenderName(message)
    });

    replySender.textContent = replyingTo.senderName;
    replyText.textContent = replyingTo.preview;
    replyPreview.classList.remove("hidden");
    messageInput?.focus();
}

attachButton?.addEventListener("click", () => {
    attachmentInput?.click();
});

messageList?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const replyButton = event.target.closest(
        '[data-message-action="reply"]'
    );

    if (replyButton) {
        const messageId = replyButton.dataset.messageId;
        const message = getMessageById(messageId);

        if (message) {
            openReply(message);
        }

        return;
    }

    const image = event.target.closest(".chat-image-preview");

    if (!image) {
        return;
    }

    openImageViewer(
        image.dataset.image,
        image.alt
    );
});

messageList?.addEventListener("contextmenu", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const message = event.target.closest(
        ".message-row[data-message-id]"
    );

    if (!message) {
        return;
    }

    event.preventDefault();

    const messageObject = getMessageById(
        message.dataset.messageId
    );

    if (!messageObject) {
        return;
    }

    selectedMessage = {
        ...messageObject,
        senderName: getReplySenderName(messageObject)
    };

    showMessageMenu(
        event.clientX,
        event.clientY,
        selectedMessage,
        currentChatUser?.uid
    );
});

document.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
        hideMessageMenu();
        selectedMessage = null;
        return;
    }

    const actionButton = event.target.closest(
        "#messageMenu [data-action]"
    );

    if (actionButton && selectedMessage) {
        const action = actionButton.dataset.action;
        const actionMessage = selectedMessage;

        switch (action) {
            case "reply":
                openReply(actionMessage);
                break;
            case "copy":
                try {
                    await copyMessage(actionMessage.text || "");
                    showToast("Message copied.", "success");
                } catch (error) {
                    handleError(
                        error,
                        "Unable to copy message."
                    );
                }
                break;
            case "copy-link":
                try {
                    await copyMessage(actionMessage.fileUrl || "");
                    showToast("Link copied.", "success");
                } catch (error) {
                    handleError(
                        error,
                        "Unable to copy link."
                    );
                }
                break;
            case "edit":
                if (
                    !currentChatUser ||
                    actionMessage.senderId !== currentChatUser.uid
                ) {
                    showToast(
                        "You can only edit your own messages.",
                        "warning"
                    );
                    break;
                }

                if (actionMessage.type !== MESSAGE_TYPES.TEXT) {
                    showToast(
                        "Only text messages can be edited.",
                        "warning"
                    );
                    break;
                }

                hideMessageMenu();

                {
                    const newText = window.prompt(
                        "Edit your message:",
                        actionMessage.text
                    );

                    if (newText === null || !newText.trim()) {
                        break;
                    }

                    try {
                        await editMessage({
                            conversationId,
                            messageId: actionMessage.id,
                            newText
                        });

                        showToast(
                            "Message updated.",
                            "success"
                        );
                    } catch (error) {
                        handleError(
                            error,
                            "Unable to update message."
                        );
                    }
                }
                break;
            case "delete":
                if (!currentChatUser) {
                    showToast(
                        "The conversation is not ready yet.",
                        "warning"
                    );
                    break;
                }

                hideMessageMenu();

                {
                    const canDeleteForEveryone =
                        actionMessage.senderId ===
                            currentChatUser.uid &&
                        !actionMessage.deleted &&
                        !actionMessage.deletedAt;
                    const deleteScope =
                        await openDeleteMessageDialog({
                            canDeleteForEveryone
                        });

                    if (!deleteScope) {
                        break;
                    }

                    try {
                        if (
                            deleteScope === "everyone" &&
                            canDeleteForEveryone
                        ) {
                            await deleteMessageForEveryone({
                                conversationId,
                                messageId: actionMessage.id
                            });

                            showToast(
                                "Message deleted for everyone.",
                                "success"
                            );
                        } else {
                            await deleteMessageForMe({
                                conversationId,
                                messageId: actionMessage.id,
                                userId: currentChatUser.uid
                            });

                            showToast(
                                "Message deleted for you.",
                                "success"
                            );
                        }

                        if (replyingTo?.id === actionMessage.id) {
                            clearReply();
                        }
                    } catch (error) {
                        handleError(
                            error,
                            "Unable to delete message."
                        );
                    }
                }
                break;
        }
    }

    hideMessageMenu();
    selectedMessage = null;
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        hideMessageMenu();
        selectedMessage = null;
    }
});

cancelReply?.addEventListener("click", clearReply);

attachmentInput?.addEventListener("change", async () => {
    const file = attachmentInput.files?.[0];

    if (!file) {
        return;
    }

    if (
        !currentChatUser ||
        !conversationId ||
        (!activeReceiverId && activeConversation?.type !== "group")
    ) {
        showToast(
            "The conversation is not ready yet.",
            "error"
        );
        attachmentInput.value = "";
        return;
    }

    if (attachmentUploading) {
        showToast(
            "Please wait for the current upload to finish.",
            "warning"
        );
        attachmentInput.value = "";
        return;
    }

    if (!uploadProgressContainer || !uploadProgressBar) {
        handleError(
            new Error("Upload progress controls are unavailable."),
            "Unable to upload attachment."
        );
        attachmentInput.value = "";
        return;
    }

    try {
        attachmentUploading = true;
        validateAttachment(file);

        const attachmentReply = replyingTo
            ? { ...replyingTo }
            : null;

        attachButton?.setAttribute("disabled", "");
        uploadProgressContainer.classList.remove("hidden");
        uploadProgressContainer.setAttribute("aria-valuenow", "0");
        uploadProgressBar.style.width = "0%";

        const uploadedFile = await uploadChatAttachment(
            file,
            conversationId,
            currentChatUser.uid,
            (progress) => {
                uploadProgressBar.style.width = `${progress}%`;
                uploadProgressContainer.setAttribute(
                    "aria-valuenow",
                    String(progress)
                );
            }
        );

        const messageType = file.type.startsWith("image/")
            ? MESSAGE_TYPES.IMAGE
            : MESSAGE_TYPES.FILE;

        await sendMessage({
            conversationId,
            senderId: currentChatUser.uid,
            receiverId: activeReceiverId,
            groupId: activeConversation?.groupId || null,
            conversationType: activeConversation?.type || "direct",
            senderName: getParticipantName(currentChatUser),
            type: messageType,
            text: "",
            fileUrl: uploadedFile.url,
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            mimeType: uploadedFile.mimeType,
            reply: attachmentReply
        });

        if (
            attachmentReply &&
            replyingTo?.messageId === attachmentReply.messageId
        ) {
            clearReply();
        }

        showToast(
            messageType === MESSAGE_TYPES.IMAGE
                ? "Image sent."
                : "File sent.",
            "success"
        );
    } catch (error) {
        console.error("Attachment upload failed:", error);
        handleError(
            error,
            "Unable to send attachment."
        );
    } finally {
        attachmentUploading = false;
        attachButton?.removeAttribute("disabled");
        uploadProgressContainer.classList.add("hidden");
        uploadProgressContainer.setAttribute("aria-valuenow", "0");
        uploadProgressBar.style.width = "0%";
        attachmentInput.value = "";
    }
});

function renderChatMessages(currentUserId) {
    const persistedIds = new Set(
        latestMessages.map((message) => message.id)
    );

    const visiblePendingMessages = pendingMessages.filter(
        (message) => !persistedIds.has(message.id)
    );

    renderMessages(
        [...latestMessages, ...visiblePendingMessages],
        currentUserId,
        {
            conversationType: activeConversation?.type || "direct",
            memberCount: activeConversation?.memberCount || 0
        }
    );
}

function renderChatMessage(message) {
    if (!messageList) {
        return;
    }

    messageList.innerHTML = `
        <p class="empty-state">
            ${message}
        </p>
    `;
}

function getParticipantName(profile) {
    return (
        profile?.fullName ||
        profile?.name ||
        profile?.displayName ||
        profile?.email ||
        "Student"
    );
}

async function initializeChat(currentUser) {
    if (!conversationId) {
        showToast(
            "Conversation could not be found.",
            "error"
        );
        renderChatMessage("Conversation not found.");
        return;
    }

    const conversation =
    await getConversationById(conversationId);
    const isGroup = conversation.type === "group";
    const group = isGroup
        ? await getStudyGroup(conversation.groupId)
        : null;

    if (group) {
        conversation.title = group.name;
        conversation.memberCount = Number(group.memberCount || 0);
    }
    const participantIds = conversation.participantIds || [];

    if (!isGroup && !participantIds.includes(currentUser.uid)) {
        renderChatMessage("You do not have access to this conversation.");
        return;
    }

    const receiverId = isGroup
        ? null
        : participantIds.find((participantId) =>
            participantId !== currentUser.uid
        );

    if (!isGroup && !receiverId) {
        throw new Error("Conversation participant is missing.");
    }

    activeConversation = conversation;
    activeReceiverId = receiverId;
    currentChatUser = currentUser;

    const otherUser = receiverId
        ? await getUserProfile(receiverId)
        : null;
    const otherUserName = getParticipantName(otherUser);
    activeOtherUserName = otherUserName;

    const chatUserName = document.getElementById("chatUserName");
    const chatStatus = document.getElementById("chatStatus");
    const chatHeaderLink = document.getElementById("chatHeaderLink");

    if (chatUserName) {
        chatUserName.textContent = isGroup
            ? conversation.title || "Study Group"
            : otherUserName;
    }

    if (chatStatus) {
        chatStatus.textContent = isGroup
            ? `${conversation.memberCount || 0} members`
            : "Mutual connection";
    }

    if (chatHeaderLink && isGroup) {
        chatHeaderLink.href = `group-details.html?id=${conversation.groupId}`;
        chatHeaderLink.setAttribute("aria-label", "Open group information");
    }

    reactionController?.destroy();
    reactionController = initializeReactions({
        conversationId,
        currentUserId: currentUser.uid,
        messageContainer: messageList
    });

    try {
        readReceiptController?.destroy();
        readReceiptController = initializeReadReceipts({
            conversationId,
            currentUserId: currentUser.uid,
            messagesContainer: messageList
        });
    } catch (error) {
        readReceiptController = null;
        console.error(
            "Failed to initialize read receipts:",
            error
        );
    }

    unsubscribeMessages =
    subscribeToMessages(
        conversationId,
        (messages) => {
            latestMessages = messages;
            renderChatMessages(currentUser.uid);

            if (targetMessageId && !targetMessageLocated) {
                const targetMessage = Array.from(
                    messageList?.querySelectorAll("[data-message-id]") || []
                ).find((element) => (
                    element.dataset.messageId === targetMessageId
                ));

                if (targetMessage) {
                    targetMessageLocated = true;
                    targetMessage.classList.add("message-targeted");
                    targetMessage.setAttribute("tabindex", "-1");
                    targetMessage.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                    targetMessage.focus({ preventScroll: true });
                }
            }
        }
    );

    unsubscribeTyping =
    subscribeToTypingStatus(
        conversationId,
        (statuses) => {
            const indicator =
            document.getElementById("typingIndicator");

            if (!indicator) return;

            const typingText = getTypingIndicatorText(
                statuses.map((status) => ({
                    ...status,
                    displayName: status.displayName || otherUserName
                })),
                currentUser.uid
            );

            indicator.hidden = !typingText;
            indicator.textContent = typingText;
        },
        (error) => {
            handleError(
                error,
                "Unable to load typing status."
            );
        }
    );

    initializeMessageForm(
        currentUser,
        receiverId
    );

    initializeTypingIndicator(currentUser);
}

function initializeMessageForm(
    user,
    receiverId
) {
    if (!messageForm || !messageInput) {
        return;
    }

    messageForm.onsubmit = async (event) => {
        event.preventDefault();

        const text = messageInput.value.trim();

        if (!text) {
            handleError(
                new Error("Message cannot be empty."),
                "Unable to send message."
            );
            return;
        }

        const messageId = createMessageId();
        const replyMetadata = replyingTo
            ? { ...replyingTo }
            : null;

        pendingMessages.push({
            id: messageId,
            conversationId,
            senderId: user.uid,
            receiverId,
            groupId: activeConversation?.groupId || null,
            conversationType: activeConversation?.type || "direct",
            senderName: getParticipantName(user),
            type: MESSAGE_TYPES.TEXT,
            text,
            createdAt: new Date(),
            deliveredAt: null,
            readAt: null,
            status: "sending",
            reply: replyMetadata
        });

        messageInput.value = "";
        renderChatMessages(user.uid);

        try {
            await sendMessage({
                conversationId,
                senderId: user.uid,
                receiverId,
                groupId: activeConversation?.groupId || null,
                conversationType: activeConversation?.type || "direct",
                senderName: getParticipantName(user),
                text,
                messageId,
                reply: replyMetadata
            });

            if (
                replyMetadata &&
                replyingTo?.messageId === replyMetadata.messageId
            ) {
                clearReply();
            }

            try {
                await setTypingStatus(
                    conversationId,
                    user.uid,
                    false,
                    getParticipantName(user)
                );
            } catch (error) {
                console.error(
                    "Typing reset failed:",
                    error
                );
            }
        } catch (error) {
            if (!messageInput.value) {
                messageInput.value = text;
            }

            handleError(
                error,
                "Unable to send message."
            );
        } finally {
            pendingMessages = pendingMessages.filter(
                (message) => message.id !== messageId
            );
            renderChatMessages(user.uid);
        }
    };
}

function initializeTypingIndicator(user) {
    if (!messageInput) {
        return;
    }

    messageInput.oninput = async () => {
        const hasText =
        messageInput.value.trim().length > 0;

        try {
            await setTypingStatus(
                conversationId,
                user.uid,
                hasText,
                getParticipantName(user)
            );
        } catch (error) {
            console.error(
                "Typing status failed:",
                error
            );
        }

        clearTimeout(typingTimer);

        typingTimer = setTimeout(
            async () => {
                try {
                    await setTypingStatus(
                        conversationId,
                        user.uid,
                        false,
                        getParticipantName(user)
                    );
                } catch (error) {
                    console.error(
                        "Typing reset failed:",
                        error
                    );
                }
            },
            1200
        );
    };
}

onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    try {
        await initializeChat(currentUser);
    } catch (error) {
        handleError(
            error,
            "Unable to load conversation."
        );
        renderChatMessage("Unable to load conversation.");
    }
});

window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
        return;
    }
    if (typeof unsubscribeMessages === "function") {
        unsubscribeMessages();
    }

    if (typeof unsubscribeTyping === "function") {
        unsubscribeTyping();
    }

    reactionController?.destroy();
    reactionController = null;
    readReceiptController?.destroy();
    readReceiptController = null;

    if (auth.currentUser && conversationId) {
        setTypingStatus(
            conversationId,
            auth.currentUser.uid,
            false,
            getParticipantName(auth.currentUser)
        ).catch(() => {});
    }

    clearTimeout(typingTimer);
});
