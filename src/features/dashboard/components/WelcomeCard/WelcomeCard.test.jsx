import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { WelcomeCard, getDailyMotivation } from "./WelcomeCard.jsx";

function createStorage() {
    const store = new Map();

    return {
        clear: () => store.clear(),
        getItem: (key) => store.get(key) ?? null,
        removeItem: (key) => store.delete(key),
        setItem: (key, value) => store.set(key, String(value))
    };
}

describe("WelcomeCard", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useFakeTimers();
        const storage = createStorage();
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: storage
        });
        vi.stubGlobal("localStorage", storage);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("renders the personalized welcome card", () => {
        vi.setSystemTime(new Date("2026-07-28T18:30:00Z"));

        render(
            <WelcomeCard
                greeting={{ name: "Amogelang" }}
                studyStreak={12}
                user={{
                    displayName: "Amogelang Shogole",
                    photoURL: null,
                    uid: "student-1"
                }}
            />
        );

        expect(
            screen.getByRole("heading", {
                name: /Good Evening, Amogelang Shogole/i
            })
        ).toBeVisible();
        expect(
            screen.getByRole("img", { name: "Amogelang Shogole" })
        ).toHaveTextContent("AS");
        expect(
            screen.getByRole("button", { name: "Continue Learning" })
        ).toBeVisible();
        expect(screen.getByText("Study Streak: 12 Days")).toBeVisible();
        expect(
            screen.getByText(
                "Every study session brings you closer to your goals."
            )
        ).toBeVisible();
    });

    test("continues to the student's latest learning item", () => {
        const onContinueLearning = vi.fn();
        render(
            <WelcomeCard
                onContinueLearning={onContinueLearning}
                user={{ displayName: "Student", uid: "student-1" }}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Continue Learning" })
        );
        expect(onContinueLearning).toHaveBeenCalledOnce();
    });

    test("shows the loading skeletons", () => {
        const { container } = render(<WelcomeCard loading user={null} />);

        expect(container.querySelectorAll("[data-skeleton]").length).toBe(4);
    });

    test("shows the empty state when no user is available", () => {
        render(<WelcomeCard loading={false} user={null} />);

        expect(
            screen.getByRole("heading", {
                name: "Welcome to StudentHub 👋"
            })
        ).toBeVisible();
        expect(
            screen.getByRole("button", { name: "Complete Profile" })
        ).toBeVisible();
    });

    test("keeps the daily motivation stable for the same day", () => {
        window.localStorage.clear();

        const first = getDailyMotivation("student-1", new Date("2026-07-28"));
        const second = getDailyMotivation("student-1", new Date("2026-07-28"));

        expect(first).toBe(second);
    });
});
