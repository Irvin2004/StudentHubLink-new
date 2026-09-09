import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ContinueLearning } from "./ContinueLearning.jsx";
import { ResourceCard } from "./ResourceCard.jsx";

const resources = [
    {
        id: "robotics-1",
        title: "Robotics Fundamentals",
        subject: "Robotics",
        progress: 65,
        lastOpened: "2 hours ago"
    },
    {
        id: "python-1",
        title: "Python Programming",
        subject: "Programming",
        progress: 40,
        lastOpened: "Yesterday"
    },
    {
        id: "database-1",
        title: "Database Systems",
        subject: "Database",
        progress: 90,
        lastOpened: "3 days ago"
    }
];

test("renders the continue learning widget", () => {
    render(<ContinueLearning resources={resources} />);

    expect(
        screen.getByRole("heading", { name: "Continue Learning" })
    ).toBeVisible();
    expect(screen.getByText("Robotics Fundamentals")).toBeVisible();
    expect(screen.getByText("Python Programming")).toBeVisible();
    expect(screen.getByText("Database Systems")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Continue" })).toHaveLength(3);
});

test("opens the selected resource", () => {
    const onOpenResource = vi.fn();

    render(
        <ContinueLearning
            onOpenResource={onOpenResource}
            resources={resources}
        />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Continue" })[0]);

    expect(onOpenResource).toHaveBeenCalledWith("robotics-1");
});

test("shows loading skeleton cards", () => {
    const { container } = render(<ContinueLearning loading />);

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(15);
});

test("shows the empty state", () => {
    render(<ContinueLearning onBrowseResources={vi.fn()} resources={[]} />);

    expect(
        screen.getByRole("heading", { name: "Continue Learning" })
    ).toBeVisible();
    expect(
        screen.getByRole("button", { name: "Browse Resources" })
    ).toBeVisible();
});

test("renders a resource card", () => {
    render(
        <ResourceCard
            lastOpened="2 hours ago"
            onContinue={vi.fn()}
            progress={65}
            subject="Robotics"
            title="Robotics Fundamentals"
        />
    );

    expect(screen.getByText("Robotics Fundamentals")).toBeVisible();
    expect(screen.getByText("Robotics")).toBeVisible();
    expect(screen.getByText("65%")).toBeVisible();
    expect(screen.getByText("Last opened: 2 hours ago")).toBeVisible();
});

test("opens and reviews a recently studied flashcard deck", () => {
    const onOpenFlashcards = vi.fn();
    const onReviewFlashcards = vi.fn();
    render(
        <ContinueLearning
            onOpenFlashcards={onOpenFlashcards}
            onReviewFlashcards={onReviewFlashcards}
            resources={[
                {
                    deckId: "deck-1",
                    dueCount: 3,
                    id: "deck-1",
                    lastOpenedLabel: "1h ago",
                    learningType: "flashcard",
                    subject: "Robotics",
                    title: "Robot basics"
                }
            ]}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Review 3 Due" }));
    expect(onOpenFlashcards).toHaveBeenCalledWith("deck-1");
    expect(onReviewFlashcards).toHaveBeenCalledWith("deck-1");
});

test("opens and retries the most recently taken quiz", () => {
    const onOpenQuiz = vi.fn();
    render(
        <ContinueLearning
            onOpenQuiz={onOpenQuiz}
            resources={[
                {
                    id: "quiz-1",
                    lastOpenedLabel: "Today",
                    learningType: "quiz",
                    progress: 80,
                    quizId: "quiz-1",
                    subject: "Programming",
                    title: "Programming Quiz"
                }
            ]}
        />
    );
    fireEvent.click(screen.getByRole("button", { name: "Open Quiz" }));
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(onOpenQuiz).toHaveBeenCalledTimes(2);
    expect(onOpenQuiz).toHaveBeenCalledWith("quiz-1");
});
