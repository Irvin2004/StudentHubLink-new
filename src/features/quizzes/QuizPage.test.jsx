import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const quizState = vi.hoisted(() => ({
    addQuestion: vi.fn().mockResolvedValue({ id: "new-question" }),
    addQuiz: vi.fn().mockResolvedValue({ id: "new-quiz" }),
    editQuestion: vi.fn().mockResolvedValue(true),
    error: null,
    loading: false,
    mutationError: null,
    questions: [],
    questionsError: null,
    questionsLoading: false,
    quizzes: [],
    recordAttempt: vi.fn().mockResolvedValue({ id: "attempt" }),
    reload: vi.fn(),
    removeQuestion: vi.fn().mockResolvedValue(true),
    removeQuiz: vi.fn().mockResolvedValue(true),
    selectQuiz: vi.fn(),
    selectedQuiz: null
}));

vi.mock("./hooks/useQuizzes.js", () => ({ useQuizzes: () => quizState }));

import QuizPage from "./QuizPage.jsx";

const quiz = {
    id: "quiz-1",
    questionCount: 1,
    subject: "Programming",
    title: "Programming Quiz"
};
const question = {
    correctOptionIndex: 0,
    id: "question-1",
    options: [
        "Central Processing Unit",
        "Computer Processing Utility",
        "Central Program Utility",
        "Core Processing Unit"
    ],
    position: 0,
    prompt: "What does CPU stand for?"
};

beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/app/quizzes");
    Object.assign(quizState, {
        error: null,
        loading: false,
        mutationError: null,
        questions: [question],
        questionsError: null,
        questionsLoading: false,
        quizzes: [quiz],
        selectedQuiz: quiz
    });
});

test("shows a selected quiz and opens take-quiz mode", () => {
    render(<QuizPage />);
    expect(screen.getAllByText("Programming Quiz")).toHaveLength(2);
    expect(screen.getByText("Central Processing Unit (Correct)")).toBeVisible();
    expect(screen.getByText("No weak questions")).toBeVisible();
    expect(screen.getByText("No linked flashcard deck")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Take Quiz" }));
    expect(screen.getByText("Question 1 / 1")).toBeVisible();
});

test("opens the flashcard deck linked to a generated quiz", () => {
    const linkedQuiz = { ...quiz, flashcardDeckId: "deck-1" };
    Object.assign(quizState, {
        quizzes: [linkedQuiz],
        selectedQuiz: linkedQuiz
    });
    render(<QuizPage />);

    fireEvent.click(
        screen.getByRole("button", { name: "Open Flashcard Deck" })
    );
    expect(window.location.search).toBe("?deck=deck-1");
});

test("creates quizzes and four-option questions", async () => {
    render(<QuizPage />);
    fireEvent.click(screen.getByRole("button", { name: "Create Quiz" }));
    let dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Quiz title/), {
        target: { value: "Database Quiz" }
    });
    fireEvent.change(within(dialog).getByLabelText(/^Subject/), {
        target: { value: "Database" }
    });
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Create Quiz" })
    );
    await waitFor(() =>
        expect(quizState.addQuiz).toHaveBeenCalledWith({
            subject: "Database",
            title: "Database Quiz"
        })
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Question" }));
    dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Question/), {
        target: { value: "What is SQL?" }
    });
    ["Language", "Server", "Browser", "Device"].forEach((value, index) => {
        fireEvent.change(
            within(dialog).getByLabelText(new RegExp(`^Option ${index + 1}`)),
            {
                target: { value }
            }
        );
    });
    fireEvent.click(within(dialog).getByLabelText("Mark option 1 correct"));
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Add Question" })
    );
    await waitFor(() =>
        expect(quizState.addQuestion).toHaveBeenCalledWith({
            correctOptionIndex: 0,
            options: ["Language", "Server", "Browser", "Device"],
            prompt: "What is SQL?"
        })
    );
});

test("edits and confirms deletion of questions and quizzes", async () => {
    render(<QuizPage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    let dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Question/), {
        target: { value: "What is a CPU?" }
    });
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Save Changes" })
    );
    await waitFor(() =>
        expect(quizState.editQuestion).toHaveBeenCalledWith(
            "question-1",
            expect.objectContaining({ prompt: "What is a CPU?" })
        )
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    dialog = screen.getByRole("dialog");
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Delete Question" })
    );
    await waitFor(() =>
        expect(quizState.removeQuestion).toHaveBeenCalledWith("question-1")
    );

    fireEvent.click(
        screen.getByRole("button", { name: "Delete Programming Quiz" })
    );
    dialog = screen.getByRole("dialog");
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Delete Quiz" })
    );
    await waitFor(() =>
        expect(quizState.removeQuiz).toHaveBeenCalledWith("quiz-1")
    );
});

test("shows empty and error states", () => {
    quizState.quizzes = [];
    quizState.selectedQuiz = null;
    const { rerender } = render(<QuizPage />);
    expect(screen.getByText("No quizzes yet")).toBeVisible();

    quizState.error = new Error("offline");
    rerender(<QuizPage />);
    expect(screen.getByText("Quizzes unavailable")).toBeVisible();
});

test("shows derived stats and starts weak-question practice", () => {
    const attemptedQuiz = {
        ...quiz,
        attempts: [
            {
                answers: [{ correct: false, questionId: "question-1" }],
                completedAt: new Date(),
                percentage: 40
            }
        ],
        stats: {
            attempts: 1,
            averageScore: 40,
            bestScore: 40,
            latestCompletedAt: new Date(),
            latestScore: 40
        }
    };
    quizState.quizzes = [attemptedQuiz];
    quizState.selectedQuiz = attemptedQuiz;
    render(<QuizPage />);

    expect(screen.getByRole("heading", { name: "Quiz Stats" })).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Weak Questions" })
    ).toBeVisible();
    fireEvent.click(
        screen.getByRole("button", { name: "Practice Weak Questions (1)" })
    );
    expect(screen.getByText("Practising weak questions")).toBeVisible();
});

test("selects a quiz from a dashboard deep link", async () => {
    quizState.selectedQuiz = null;
    quizState.questions = [];
    window.history.replaceState({}, "", "/app/quizzes?quiz=quiz-1&mode=take");
    render(<QuizPage />);
    await waitFor(() =>
        expect(quizState.selectQuiz).toHaveBeenCalledWith("quiz-1")
    );
});
