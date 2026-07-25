import { describe, expect, test } from "vitest";

import { CHANNEL_TYPES } from "../config/channel-types.js";
import {
    createChannelModel,
    normalizeChannelName,
    validateChannelInput
} from "./channel.js";

describe("Channel model", () => {
    test("normalizes valid channel names", () => {
        expect(normalizeChannelName("  Study Group! ")).toBe("study-group");
        expect(
            validateChannelInput({
                name: "Study Group",
                description: "Exam prep",
                type: CHANNEL_TYPES.TEXT
            })
        ).toEqual({
            name: "study-group",
            description: "Exam prep",
            type: CHANNEL_TYPES.TEXT
        });
    });

    test("protects the reserved general name", () => {
        expect(() => validateChannelInput({ name: "general" })).toThrow(
            /reserved/
        );
    });

    test("creates the immutable default general channel model", () => {
        const channel = createChannelModel({
            id: "general",
            communityId: "community-1",
            name: "general",
            description: "General conversation.",
            type: CHANNEL_TYPES.TEXT,
            createdBy: "owner-1",
            position: 0
        });

        expect(channel).toMatchObject({
            id: "general",
            name: "general",
            position: 0
        });
        expect(Object.isFrozen(channel)).toBe(true);
    });
});
