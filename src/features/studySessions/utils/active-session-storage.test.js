import { beforeEach, expect, test } from "vitest";

import {
    clearActiveStudySession,
    readActiveStudySession,
    writeActiveStudySession
} from "./active-session-storage.js";

beforeEach(() => {
    const values = new Map();
    Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
            clear: () => values.clear(),
            getItem: (key) => values.get(key) ?? null,
            removeItem: (key) => values.delete(key),
            setItem: (key, value) => values.set(key, String(value))
        }
    });
});

test("round-trips active timer state for recovery", () => {
    writeActiveStudySession("user-1", {
        accumulatedSeconds: 45,
        runStartedAt: 1_700_000_000_000,
        session: {
            startedAt: new Date("2026-08-10T09:00:00"),
            subject: "Robotics",
            title: "Robot fundamentals"
        },
        status: "running"
    });

    expect(readActiveStudySession("user-1")).toEqual(
        expect.objectContaining({
            accumulatedSeconds: 45,
            runStartedAt: 1_700_000_000_000,
            status: "running"
        })
    );
    expect(readActiveStudySession("user-1").session.startedAt).toEqual(
        new Date("2026-08-10T09:00:00")
    );

    clearActiveStudySession("user-1");
    expect(readActiveStudySession("user-1")).toBeNull();
});
