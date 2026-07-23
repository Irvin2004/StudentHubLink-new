import test from "node:test";
import assert from "node:assert/strict";

import { CONVERSATION_PREFERENCES } from "../js/config/conversation-preference-types.js";
import {
    createConversationPreferenceModel,
    validateConversationPreference
} from "../js/models/conversation-preference.js";

test("conversation preference types are frozen and unique", () => {
    const values = Object.values(CONVERSATION_PREFERENCES);

    assert.equal(Object.isFrozen(CONVERSATION_PREFERENCES), true);
    assert.equal(new Set(values).size, values.length);
    assert.deepEqual(values, ["pinned", "muted", "archived"]);
});

test("conversation preference model trims IDs and applies defaults", () => {
    assert.deepEqual(
        createConversationPreferenceModel({
            conversationId: " conversation-1 ",
            userId: " user-1 "
        }),
        {
            conversationId: "conversation-1",
            userId: "user-1",
            pinned: false,
            muted: false,
            archived: false,
            createdAt: null,
            updatedAt: null
        }
    );
});

test("conversation preference validation rejects IDs and non-booleans", () => {
    const validation = validateConversationPreference({
        conversationId: "",
        userId: " ",
        pinned: "yes",
        muted: null,
        archived: 0
    });

    assert.equal(validation.isValid, false);
    assert.deepEqual(Object.keys(validation.errors).sort(), [
        "archived",
        "conversationId",
        "muted",
        "pinned",
        "userId"
    ]);
});
