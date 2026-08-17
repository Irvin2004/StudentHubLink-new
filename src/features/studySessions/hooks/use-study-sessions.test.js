import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const services = vi.hoisted(() => ({
    getStudyPreferences: vi.fn(),
    getStudySessions: vi.fn(),
    updateWeeklyStudyGoal: vi.fn()
}));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock("../services/study-session-service.js", () => services);

import { useStudySessions } from "./useStudySessions.js";

beforeEach(() => {
    vi.clearAllMocks();
    services.getStudyPreferences.mockResolvedValue({
        weeklyGoalMinutes: 480
    });
    services.getStudySessions.mockResolvedValue([
        {
            actualMinutes: 60,
            completedAt: new Date(),
            durationSeconds: 3600,
            id: "session-1",
            subject: "Robotics"
        }
    ]);
    services.updateWeeklyStudyGoal.mockImplementation(
        async (_userId, minutes) => {
            services.getStudyPreferences.mockResolvedValue({
                weeklyGoalMinutes: minutes
            });
            return minutes;
        }
    );
});

test("loads, recalculates, and persists a custom weekly goal", async () => {
    const { result } = renderHook(() => useStudySessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.weeklyGoalMinutes).toBe(480);
    expect(result.current.weeklyMinutes).toBe(60);
    expect(result.current.weeklyProgress).toBe(13);

    await act(async () => {
        await result.current.setWeeklyGoal(600);
    });

    expect(services.updateWeeklyStudyGoal).toHaveBeenCalledWith("user-1", 600);
    expect(result.current.weeklyGoalMinutes).toBe(600);
    expect(result.current.weeklyProgress).toBe(10);
});
