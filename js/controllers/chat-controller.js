import { auth } from "../firebase.js";
import { getConversationById } from "../services/chat-service.js";
import {
    sendMessage,
    subscribeToMessages
} from "../services/messages-service.js";
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

    unsubscribeMessages =
    subscribeToMessages(
        conversationId,
        (messages) => {
            renderMessages(messages, currentUser.uid);
        }
    );

    unsubscribeTyping =
    subscribeToTypingStatus(
        conversationId,
        currentUser.uid,
        (isTyping) => {
            const indicator =
            document.getElementById("typingIndicator");

            if (!indicator) return;

            indicator.hidden = !isTyping;
            indicator.textContent =
            isTyping ? "The other user is typing..." : "";
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

        try {
            await sendMessage({
                conversationId,
                senderId: user.uid,
                receiverId,
                text: messageInput.value
            });

            messageInput.value = "";

            await setTypingStatus(
                conversationId,
                user.uid,
                false
            );
        } catch (error) {
            handleError(
                error,
                "Unable to send message."
            );
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
            1500
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

    clearTimeout(typingTimer);
});
