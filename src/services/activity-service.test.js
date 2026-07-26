import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    onSnapshot: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { _methodName: "serverTimestamp" }
}));

vi.mock("firebase/firestore", () => ({
    collection: (...segments) => ({
        path: segments.map((segment) => segment.path || segment).join("/")
    }),
    doc: (reference) => ({
        id: "activity-1",
        path: `${reference.path}/activity-1`
    }),
    limit: (value) => ({ type: "limit", value }),
    onSnapshot: mocks.onSnapshot,
    orderBy: (field, direction) => ({ type: "orderBy", field, direction }),
    query: (reference, ...constraints) => ({ reference, constraints }),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc
}));

vi.mock("../firebase/index.js", () => ({
    db: { path: "db" }
}));

import { createActivity, listenToActivity } from "./activity-service.js";

describe("activity service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setDoc.mockResolvedValue();
    });

    test("stores a normalized supported event", async () => {
        await expect(
            createActivity("community-1", {
                type: "member_joined",
                actorId: " user-1 ",
                actorName: " Alex ",
                title: " Alex joined ",
                description: " Ready to participate "
            })
        ).resolves.toBe("activity-1");

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({
                path: expect.stringContaining(
                    "communities/community-1/activities"
                )
            }),
            expect.objectContaining({
                actorId: "user-1",
                actorName: "Alex",
                title: "Alex joined",
                createdAt: mocks.timestamp
            })
        );
    });

    test("rejects unsupported activity types", async () => {
        await expect(
            createActivity("community-1", {
                type: "message_sent",
                actorId: "user-1",
                actorName: "Alex",
                title: "Message"
            })
        ).rejects.toThrow(/unsupported/i);
    });

    test("limits the live feed to the latest 30 events", () => {
        const unsubscribe = vi.fn();
        mocks.onSnapshot.mockReturnValue(unsubscribe);

        expect(listenToActivity("community-1", vi.fn(), vi.fn())).toBe(
            unsubscribe
        );
        expect(mocks.onSnapshot).toHaveBeenCalledWith(
            expect.objectContaining({
                constraints: expect.arrayContaining([
                    { type: "limit", value: 30 }
                ])
            }),
            expect.any(Function),
            expect.any(Function)
        );
    });
});
