import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { FocusCard, getFocusTitle, getPriorityColor } from "./FocusCard.jsx";

test("renders the focus card", () => {
    render(
        <FocusCard
            task={{
                id: "robotics-assignment",
                title: "Finish Robotics Assignment",
                subject: "Robotics",
                due: "Tomorrow",
                estimatedTime: "45 min",
                priority: "high"
            }}
            weeklyProgress={60}
        />
    );

    expect(
        screen.getByRole("heading", { name: "Today's Focus" })
    ).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Finish Robotics Assignment" })
    ).toBeVisible();
    expect(screen.getByText("Robotics")).toBeVisible();
    expect(screen.getByText("⏰ Tomorrow")).toBeVisible();
    expect(screen.getByText("⏱ 45 min")).toBeVisible();
    expect(screen.getByText("60%")).toBeVisible();
    expect(screen.getByText(/Weekly Goal/)).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "60"
    );
    expect(screen.getByRole("button", { name: "Open Task" })).toBeVisible();
    expect(screen.getByText("HIGH")).toBeVisible();
});

test("emits the task id when continuing", () => {
    const onContinue = vi.fn();

    render(
        <FocusCard
            onContinue={onContinue}
            task={{
                id: "robotics-assignment",
                title: "Finish Robotics Assignment",
                subject: "Robotics",
                due: "Tomorrow",
                estimatedTime: "45 min",
                priority: "high"
            }}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Task" }));

    expect(onContinue).toHaveBeenCalledWith("robotics-assignment");
});

test("shows loading skeletons", () => {
    const { container } = render(<FocusCard loading />);

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(6);
});

test("uses the shared load-error state", () => {
    render(<FocusCard error={new Error("Failed")} onRetry={vi.fn()} />);

    expect(
        screen.getByRole("heading", { name: "Today's focus unavailable" })
    ).toBeVisible();
});

test("shows the empty state", () => {
    const onBrowseResources = vi.fn();

    render(<FocusCard onBrowseResources={onBrowseResources} />);

    expect(
        screen.getByRole("heading", { name: "You're all caught up!" })
    ).toBeVisible();
    expect(
        screen.getByText("No active study tasks need your attention.")
    ).toBeVisible();
    expect(
        screen.getByRole("button", { name: "Open Study Planner" })
    ).toBeVisible();
});

test("maps priority and titles", () => {
    expect(getPriorityColor("high")).toBe("danger");
    expect(getPriorityColor("medium")).toBe("warning");
    expect(getPriorityColor("low")).toBe("success");
    expect(getPriorityColor("anything else")).toBe("neutral");

    expect(getFocusTitle({ type: "resource" })).toBe("Continue Learning");
    expect(getFocusTitle({ type: "quiz" })).toBe("Next Priority");
    expect(getFocusTitle({ type: "assignment" })).toBe("Today's Focus");
    expect(getFocusTitle({})).toBe("Today's Focus");
});

test("launches a due flashcard review from flashcard focus", () => {
    const onReviewFlashcards = vi.fn();
    render(
        <FocusCard
            onReviewFlashcards={onReviewFlashcards}
            task={{
                due: "4 cards due",
                estimatedTime: "8m",
                flashcardDeckId: "deck-1",
                id: "deck-1",
                priority: "Medium",
                subject: "Robotics",
                title: "Review Robotics",
                type: "flashcards"
            }}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: /Review Due Cards/ }));
    expect(onReviewFlashcards).toHaveBeenCalledWith("deck-1");
    expect(
        screen.queryByRole("button", { name: "Start Session" })
    ).not.toBeInTheDocument();
});

test("opens a pending quiz task directly", () => {
    const onTakeQuiz = vi.fn();
    render(
        <FocusCard
            onTakeQuiz={onTakeQuiz}
            task={{
                due: "Due today",
                estimatedTime: "20 min",
                id: "task-1",
                priority: "High",
                quizId: "quiz-1",
                subject: "Programming",
                title: "Programming Quiz",
                type: "quiz"
            }}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Take Quiz" }));
    expect(onTakeQuiz).toHaveBeenCalledWith("quiz-1", "task-1");
});
