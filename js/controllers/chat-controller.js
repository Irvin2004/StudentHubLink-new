import { auth } from "../firebase.js";
import {
    getConversationById,
    getUserProfile
} from "../services/conversation-service.js";
import {
    createMessageId,
    markConversationMessagesAsRead,
    markMessagesAsDelivered,
    sendMessage,
    subscribeToMessages
} from "../services/message-service.js";
import {
    setTypingStatus,
    subscribeToTypingStatus
} from "../services/typing-service.js";
import { renderMessages } from "../renderers/message-renderer.js";
import { handleError } from "../utils/error-handler.js";
import { showToast } from "../utils/toast.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const params =
new URLSearchParams(window.location.search);

const conversationId =
params.get("id");

const messageList =
document.getElementById("messageList");

const messageForm =
document.getElementById("messageForm");

const messageInput =
document.getElementById("messageInput");

let unsubscribeMessages =
null;

let unsubscribeTyping =
null;

let typingTimer =
null;

let latestMessages = [];
let pendingMessages = [];
let receiptUpdateChain = Promise.resolve();

function renderChatMessages(currentUserId) {
    const persistedIds = new Set(
        latestMessages.map((message) => message.id)
    );

    const visiblePendingMessages = pendingMessages.filter(
        (message) => !persistedIds.has(message.id)
    );

    renderMessages(
        [...latestMessages, ...visiblePendingMessages],
        currentUserId
    );
}

function queueReceiptUpdates(messages, currentUser) {
    receiptUpdateChain = receiptUpdateChain
        .then(async () => {
            await markMessagesAsDelivered(
                messages,
                currentUser.uid
            );
            await markConversationMessagesAsRead(
                conversationId,
                currentUser.uid
            );
        })
        .catch((error) => {
            console.error("Message receipt update failed:", error);
        });
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

    const participantIds =
    conversation.participantIds || [];

    if (!participantIds.includes(currentUser.uid)) {
        renderChatMessage("You do not have access to this conversation.");
        return;
    }

    const receiverId =
    participantIds.find((participantId) =>
        participantId !== currentUser.uid
    );

    if (!receiverId) {
        throw new Error("Conversation participant is missing.");
    }

    const otherUser = await getUserProfile(receiverId);
    const otherUserName = getParticipantName(otherUser);
    const chatUserName = document.getElementById("chatUserName");

    if (chatUserName) {
        chatUserName.textContent = otherUserName;
    }

    unsubscribeMessages =
    subscribeToMessages(
        conversationId,
        (messages) => {
            latestMessages = messages;
            renderChatMessages(currentUser.uid);
            queueReceiptUpdates(messages, currentUser);
        }
    );

    unsubscribeTyping =
    subscribeToTypingStatus(
        conversationId,
        (statuses) => {
            const indicator =
            document.getElementById("typingIndicator");

            if (!indicator) return;

            const otherUserTyping = statuses.some(
                (status) =>
                    status.userId !== currentUser.uid &&
                    status.typing === true
            );

            indicator.hidden = !otherUserTyping;
            indicator.textContent =
                otherUserTyping
                    ? `${otherUserName} is typing...`
                    : "";
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

        pendingMessages.push({
            id: messageId,
            conversationId,
            senderId: user.uid,
            receiverId,
            text,
            createdAt: new Date(),
            deliveredAt: null,
            readAt: null,
            status: "sending"
        });

        messageInput.value = "";
        renderChatMessages(user.uid);

        try {
            await sendMessage({
                conversationId,
                senderId: user.uid,
                receiverId,
                text,
                messageId
            });

            try {
                await setTypingStatus(
                    conversationId,
                    user.uid,
                    false
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
                hasText
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
                        false
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

window.addEventListener("beforeunload", () => {
    if (typeof unsubscribeMessages === "function") {
        unsubscribeMessages();
    }

    if (typeof unsubscribeTyping === "function") {
        unsubscribeTyping();
    }

    if (auth.currentUser && conversationId) {
        setTypingStatus(
            conversationId,
            auth.currentUser.uid,
            false
        ).catch(() => {});
    }

    clearTimeout(typingTimer);
});
