import { describe, expect, test } from "vitest";

import { parseMentions } from "./mention-parser.js";

describe("mention parser", () => {
    test("extracts unique usernames and channel mentions", () => {
        expect(parseMentions("Hi @Alex and @maya. @alex @channel")).toEqual({
            channel: true,
            users: ["alex", "maya"]
        });
    });

    test("ignores email addresses and incomplete mentions", () => {
        expect(parseMentions("alex@example.com @ a@b.com")).toEqual({
            channel: false,
            users: []
        });
    });
});
