import { describe, expect, test } from "vitest";

import {
    ACTIVITY_TYPES,
    ACTIVITY_TYPE_VALUES,
    isActivityType
} from "./activity-types.js";

describe("activity types", () => {
    test("defines the supported community feed events", () => {
        expect(ACTIVITY_TYPE_VALUES).toEqual([
            ACTIVITY_TYPES.ANNOUNCEMENT_POSTED,
            ACTIVITY_TYPES.CHANNEL_CREATED,
            ACTIVITY_TYPES.FILE_UPLOADED,
            ACTIVITY_TYPES.MEMBER_JOINED
        ]);
        expect(isActivityType("member_joined")).toBe(true);
        expect(isActivityType("message_sent")).toBe(false);
    });
});
