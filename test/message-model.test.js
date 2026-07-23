import test from "node:test";
import assert from "node:assert/strict";

import {
    MESSAGE_TYPES,
    isValidMessageType
} from "../js/config/message-types.js";
import { createMessageModel, validateMessage } from "../js/models/message.js";

test("message types are frozen, unique, and include voice messages", () => {
    const types = Object.values(MESSAGE_TYPES);

    assert.equal(Object.isFrozen(MESSAGE_TYPES), true);
    assert.equal(new Set(types).size, types.length);
    assert.equal(isValidMessageType(MESSAGE_TYPES.VOICE), true);
    assert.equal(isValidMessageType("video"), false);
});

test("message model normalizes voice metadata", () => {
    assert.deepEqual(
        createMessageModel({
            id: " message-1 ",
            conversationId: " conversation-1 ",
            senderId: " user-1 ",
            type: MESSAGE_TYPES.VOICE,
            voice: {
                storagePath: " voice/conversation-1/message-1.webm ",
                duration: "2300",
                size: "512",
                mimeType: " AUDIO/WEBM "
            }
        }),
        {
            id: "message-1",
            conversationId: "conversation-1",
            senderId: "user-1",
            receiverId: null,
            groupId: null,
            type: MESSAGE_TYPES.VOICE,
            content: "",
            voice: {
                url: "",
                storagePath: "voice/conversation-1/message-1.webm",
                duration: 2300,
                size: 512,
                mimeType: "audio/webm"
            }
        }
    );
});

test("message model rejects incomplete voice messages", () => {
    const validation = validateMessage({
        conversationId: "conversation-1",
        senderId: "user-1",
        type: MESSAGE_TYPES.VOICE,
        voice: {}
    });

    assert.equal(validation.isValid, false);
    assert.deepEqual(Object.keys(validation.errors).sort(), [
        "voiceDuration",
        "voiceMimeType",
        "voiceSize",
        "voiceStoragePath"
    ]);
    assert.throws(
        () =>
            createMessageModel({
                conversationId: "conversation-1",
                senderId: "user-1",
                type: MESSAGE_TYPES.VOICE,
                voice: {}
            }),
        (error) =>
            Boolean(
                error.message === "Invalid message data." &&
                error.validationErrors.voiceStoragePath
            )
    );
});

test("message model normalizes lightweight reply metadata", () => {
    const message = createMessageModel({
        conversationId: " conversation-1 ",
        senderId: " user-2 ",
        type: MESSAGE_TYPES.TEXT,
        content: " This helped. ",
        reply: {
            messageId: " message-1 ",
            senderId: " user-1 ",
            preview: " Can someone explain recursion? ",
            type: MESSAGE_TYPES.TEXT
        }
    });

    assert.deepEqual(message.reply, {
        messageId: "message-1",
        senderId: "user-1",
        preview: "Can someone explain recursion?",
        type: MESSAGE_TYPES.TEXT
    });
});

test("message model validates every reply field", () => {
    const validation = validateMessage({
        conversationId: "conversation-1",
        senderId: "user-2",
        type: MESSAGE_TYPES.TEXT,
        content: "Reply",
        reply: {}
    });

    assert.deepEqual(Object.keys(validation.errors).sort(), [
        "replyMessageId",
        "replyPreview",
        "replySenderId",
        "replyType"
    ]);
});

test("non-reply messages omit reply metadata", () => {
    const message = createMessageModel({
        conversationId: "conversation-1",
        senderId: "user-1",
        type: MESSAGE_TYPES.TEXT,
        content: "Normal message"
    });

    assert.equal(Object.hasOwn(message, "reply"), false);
});
