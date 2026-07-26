import { describe, expect, test } from "vitest";

import { createMessageModel, validateMessageInput } from "./message.js";

describe("message model", () => {
    test("normalizes a new channel message and reply reference", () => {
        const message = validateMessageInput({
            communityId: " community-1 ",
            channelId: " general ",
            senderId: " user-1 ",
            senderName: " Alex ",
            text: "  Can someone share the assignment?  ",
            replyTo: {
                id: "message-0",
                senderId: "user-2",
                senderName: "Maya",
                text: "Here it is."
            }
        });

        expect(message).toMatchObject({
            communityId: "community-1",
            channelId: "general",
            senderId: "user-1",
            senderName: "Alex",
            text: "Can someone share the assignment?",
            replyTo: { id: "message-0", senderName: "Maya" }
        });
    });

    test("reserves read receipts and deletion fields", () => {
        expect(createMessageModel({ id: "message-1" })).toMatchObject({
            id: "message-1",
            readBy: [],
            edited: false,
            deleted: false,
            reactions: {}
        });
    });

    test("rejects empty messages", () => {
        expect(() =>
            validateMessageInput({
                communityId: "community-1",
                channelId: "general",
                senderId: "user-1",
                text: "  "
            })
        ).toThrow(/cannot be empty/i);
    });
});
