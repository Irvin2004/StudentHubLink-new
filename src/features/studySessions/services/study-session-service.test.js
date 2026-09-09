import { beforeEach, expect, test, vi } from "vitest";

const firestore = vi.hoisted(() => ({
    collection: vi.fn(() => "sessions-ref"),
    doc: vi.fn(() => ({ id: "session-1" })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((value) => ["limit", value]),
    orderBy: vi.fn((...value) => ["orderBy", ...value]),
    query: vi.fn((...value) => value),
    serverTimestamp: vi.fn(() => "server-time"),
    setDoc: vi.fn()
}));

vi.mock("firebase/firestore", () => firestore);
vi.mock("../../../firebase/index.js", () => ({ db: "db" }));

import {
    completeStudySession,
    getStudyPreferences,
    getStudySessions,
    updateWeeklyStudyGoal
} from "./study-session-service.js";

beforeEach(() => vi.clearAllMocks());

test("loads the signed-in user's latest completed sessions", async () => {
    firestore.getDocs.mockResolvedValue({
        docs: [{ id: "session-1", data: () => ({ actualMinutes: 25 }) }]
    });

    await expect(getStudySessions("user-1")).resolves.toEqual([
        { id: "session-1", actualMinutes: 25 }
    ]);
    expect(firestore.collection).toHaveBeenCalledWith(
        "db",
        "users",
        "user-1",
        "studySessions"
    );
});

test("persists duration and source references for a completed session", async () => {
    await completeStudySession("user-1", {
        actualMinutes: 32,
        durationSeconds: 1938,
        resourceId: "resource-1",
        sourceType: "resource",
        startedAt: new Date("2026-08-10T09:00:00"),
        subject: "Robotics",
        title: "Robotics Fundamentals"
    });

    expect(firestore.setDoc).toHaveBeenCalledWith(
        { id: "session-1" },
        expect.objectContaining({
            actualMinutes: 32,
            completedAt: "server-time",
            durationSeconds: 1938,
            resourceId: "resource-1",
            sourceType: "resource",
            subject: "Robotics",
            title: "Robotics Fundamentals"
        })
    );
});

test("uses a stable session ID for planner-linked quiz activity", async () => {
    await completeStudySession("user-1", {
        actualMinutes: 3,
        durationSeconds: 180,
        quizId: "quiz-1",
        sessionId: "quiz-attempt-1",
        sourceType: "quiz",
        startedAt: new Date("2026-08-10T09:00:00"),
        subject: "Programming",
        taskId: "task-1",
        title: "Programming Quiz"
    });

    expect(firestore.doc).toHaveBeenCalledWith(
        "sessions-ref",
        "quiz-attempt-1"
    );
    expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
            quizId: "quiz-1",
            sourceType: "quiz",
            taskId: "task-1"
        })
    );
});

test("loads and updates the user's weekly study goal", async () => {
    firestore.getDoc.mockResolvedValue({
        data: () => ({ weeklyGoalMinutes: 480 }),
        exists: () => true
    });

    await expect(getStudyPreferences("user-1")).resolves.toEqual({
        weeklyGoalMinutes: 480
    });
    await expect(updateWeeklyStudyGoal("user-1", 480)).resolves.toBe(480);
    expect(firestore.setDoc).toHaveBeenCalledWith(
        { id: "session-1" },
        {
            updatedAt: "server-time",
            weeklyGoalMinutes: 480
        },
        { merge: true }
    );
});
