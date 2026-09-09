import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { TakeQuiz } from "./TakeQuiz.jsx";

const quiz = {
    id: "quiz-1",
    subject: "Programming",
    title: "Programming Quiz"
};
const questions = [
    {
        correctOptionIndex: 0,
        id: "q1",
        options: [
            "Central Processing Unit",
            "Computer Processing Utility",
            "Central Program Utility",
            "Core Processing Unit"
        ],
        prompt: "What does CPU stand for?"
    },
    {
        correctOptionIndex: 1,
        id: "q2",
        options: ["A database", "A loop", "A browser", "A compiler"],
        prompt: "What repeats instructions?",
        sourceFlashcardId: "card-2"
    }
];

beforeEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
});

test("takes a quiz, saves the score, and reviews correct and incorrect answers", async () => {
    const onSaveAttempt = vi.fn().mockResolvedValue({ id: "attempt-1" });
    const onReviewFlashcards = vi.fn();
    render(
        <TakeQuiz
            onExit={vi.fn()}
            onReviewFlashcards={onReviewFlashcards}
            onSaveAttempt={onSaveAttempt}
            questions={questions}
            quiz={quiz}
            taskId="task-1"
        />
    );

    expect(screen.getByText("Question 1 / 2")).toBeVisible();
    fireEvent.click(screen.getByLabelText("Central Processing Unit"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByLabelText("A database"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Quiz" }));

    await waitFor(() =>
        expect(screen.getByText("Quiz Complete")).toBeVisible()
    );
    expect(onSaveAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
            percentage: 50,
            quizId: "quiz-1",
            score: 1,
            taskId: "task-1",
            totalQuestions: 2
        })
    );
    expect(onSaveAttempt.mock.calls[0][0].answers[1]).toEqual(
        expect.objectContaining({
            correct: false,
            correctOptionIndex: 1,
            selectedOptionIndex: 0
        })
    );
    expect(screen.getByText("1 / 2")).toBeVisible();
    expect(screen.getByText("50%")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Review Answers" }));
    const review = screen.getByRole("heading", {
        name: "Answer Review"
    }).parentElement;
    expect(
        within(review).getByText(/Central Processing Unit — Correct answer/)
    ).toBeVisible();
    expect(within(review).getByText(/A database — Your answer/)).toBeVisible();
    expect(
        within(review).getAllByText("Central Processing Unit").length
    ).toBeGreaterThan(0);
    fireEvent.click(
        screen.getByRole("button", { name: "Review as Flashcards" })
    );
    expect(onReviewFlashcards).toHaveBeenCalledWith(["card-2"]);
});

test("supports previous navigation and trying again", async () => {
    render(
        <TakeQuiz
            onExit={vi.fn()}
            onSaveAttempt={vi.fn().mockResolvedValue({})}
            questions={questions}
            quiz={quiz}
        />
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Question 1 / 2")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Quiz" }));
    await screen.findByText("Quiz Complete");
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(screen.getByText("Question 1 / 2")).toBeVisible();
});

test("prevents duplicate attempts when submit is clicked twice", async () => {
    let resolveAttempt;
    const onSaveAttempt = vi.fn(
        () =>
            new Promise((resolve) => {
                resolveAttempt = resolve;
            })
    );
    render(
        <TakeQuiz
            onExit={vi.fn()}
            onSaveAttempt={onSaveAttempt}
            questions={[questions[0]]}
            quiz={quiz}
        />
    );
    const submit = screen.getByRole("button", { name: "Submit Quiz" });

    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(onSaveAttempt).toHaveBeenCalledTimes(1);

    resolveAttempt({ id: "attempt-1" });
    await screen.findByText("Quiz Complete");
});

test("restores answers, position, attempt ID, and elapsed time after refresh", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T10:00:00.000Z"));
    const first = render(
        <TakeQuiz
            onExit={vi.fn()}
            onSaveAttempt={vi.fn()}
            questions={questions}
            quiz={quiz}
            taskId="task-1"
        />
    );
    fireEvent.click(screen.getByLabelText("Central Processing Unit"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    first.unmount();

    vi.setSystemTime(new Date("2026-08-14T10:01:05.000Z"));
    const recovered = render(
        <TakeQuiz
            onExit={vi.fn()}
            onSaveAttempt={vi.fn()}
            questions={questions}
            quiz={quiz}
            taskId="task-1"
        />
    );

    expect(screen.getByText("Question 2 / 2")).toBeVisible();
    expect(screen.getByLabelText("Quiz time elapsed")).toHaveTextContent(
        "01:05"
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByLabelText("Central Processing Unit")).toBeChecked();
    act(() => recovered.unmount());
    vi.useRealTimers();
});
