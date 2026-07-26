import { describe, expect, test } from "vitest";

import { createNotificationModel } from "./notification.js";

describe("notification model", () => {
    test("normalizes a real-time notification", () => {
        expect(
            createNotificationModel({
                id: "notification-1",
                type: "mention",
                title: "Alex mentioned you",
                message: "Review this",
                read: false
            })
        ).toEqual(
            expect.objectContaining({
                id: "notification-1",
                type: "mention",
                read: false
            })
        );
    });

    test("rejects unsupported notification types", () => {
        expect(() =>
            createNotificationModel({
                id: "notification-1",
                type: "unknown",
                title: "Title",
                message: "Message"
            })
        ).toThrow("Invalid notification type");
    });
});
