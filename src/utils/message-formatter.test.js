import { describe, expect, test } from "vitest";

import { formatTypingNames, groupMessagesByDate } from "./message-formatter.js";

describe("message formatter", () => {
    test("groups messages by calendar date", () => {
        const groups = groupMessagesByDate([
            { id: "1", createdAt: new Date("2026-07-24T09:00:00") },
            { id: "2", createdAt: new Date("2026-07-24T10:00:00") },
            { id: "3", createdAt: new Date("2026-07-25T10:00:00") }
        ]);

        expect(groups).toHaveLength(2);
        expect(groups[0].messages.map((message) => message.id)).toEqual([
            "1",
            "2"
        ]);
        expect(groups[1].messages[0].id).toBe("3");
    });

    test("formats one, two, and many typing users", () => {
        expect(formatTypingNames([{ displayName: "Alice" }])).toBe(
            "Alice is typing…"
        );
        expect(
            formatTypingNames([
                { displayName: "Alice" },
                { displayName: "Bob" }
            ])
        ).toBe("Alice and Bob are typing…");
        expect(
            formatTypingNames([
                { displayName: "Alice" },
                { displayName: "Bob" },
                { displayName: "Lerato" }
            ])
        ).toBe("Alice, Bob, and 1 others are typing…");
    });
});
