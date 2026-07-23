import test from "node:test";
import assert from "node:assert/strict";

import {
    REACTION_TYPES,
    isValidReaction
} from "../js/config/reaction-types.js";
import {
    createReactionModel,
    validateReaction
} from "../js/models/reaction.js";

test("reaction types are frozen, unique, and valid", () => {
    const values = Object.values(REACTION_TYPES);

    assert.equal(Object.isFrozen(REACTION_TYPES), true);
    assert.equal(new Set(values).size, values.length);
    values.forEach((reaction) => {
        assert.equal(isValidReaction(reaction), true);
    });
    assert.equal(isValidReaction("invalid"), false);
});

test("reaction model trims identifiers and returns a clean object", () => {
    assert.deepEqual(
        createReactionModel({
            messageId: " message-1 ",
            userId: " user-1 ",
            reaction: REACTION_TYPES.LOVE
        }),
        {
            messageId: "message-1",
            userId: "user-1",
            reaction: REACTION_TYPES.LOVE
        }
    );
});

test("reaction model reports invalid fields", () => {
    const validation = validateReaction({
        messageId: "",
        userId: " ",
        reaction: "💩"
    });

    assert.equal(validation.isValid, false);
    assert.deepEqual(Object.keys(validation.errors).sort(), [
        "messageId",
        "reaction",
        "userId"
    ]);
    assert.throws(
        () => createReactionModel({}),
        (error) =>
            Boolean(
                error.message === "Invalid reaction data." &&
                error.validationErrors.messageId &&
                error.validationErrors.userId &&
                error.validationErrors.reaction
            )
    );
});
