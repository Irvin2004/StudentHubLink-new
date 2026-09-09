import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const service = vi.hoisted(() => ({
    addStudyTask: vi.fn(),
    addStudyTasks: vi.fn(),
    applyStudyTaskChanges: vi.fn(),
    deleteStudyTask: vi.fn(),
    deleteStudyTasks: vi.fn(),
    getStudyPlanner: vi.fn(),
    toggleStudyTask: vi.fn(),
    updateStudyTask: vi.fn()
}));
const flashcards = vi.hoisted(() => ({ getFlashcardDecks: vi.fn() }));
const quizzes = vi.hoisted(() => ({ getQuizzes: vi.fn() }));
const memory = vi.hoisted(() => ({ getLearningMemoryOverview: vi.fn() }));
const files = vi.hoisted(() => ({ getResourceLibraryData: vi.fn() }));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));

vi.mock("../services/study-planner-service.js", () => service);
vi.mock("../../flashcards/services/flashcard-service.js", () => flashcards);
vi.mock("../../quizzes/services/quiz-service.js", () => quizzes);
vi.mock(
    "../../learningMemory/services/learning-memory-service.js",
    () => memory
);
vi.mock("../../../services/file-service.js", () => files);

import { useStudyPlanner } from "./useStudyPlanner.js";

function getRelativeDateKey(daysFromToday) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

beforeEach(() => {
    vi.clearAllMocks();
    service.getStudyPlanner.mockResolvedValue({
        tasks: [
            {
                id: "programming-assignment",
                title: "Programming Assignment",
                subject: "Programming",
                notes: "Complete the API section.",
                dueDate: "2026-08-09",
                estimatedMinutes: 90,
                priority: "High",
                completed: false
            },
            {
                id: "robotics-review",
                title: "Robotics Review",
                subject: "Robotics",
                dueDate: "2026-08-10",
                estimatedMinutes: 45,
                priority: "Medium",
                completed: true
            }
        ]
    });
    service.addStudyTask.mockResolvedValue({
        id: "new-task",
        title: "Database revision",
        subject: "Database",
        notes: "Review normalisation examples.",
        dueDate: "2026-08-11",
        estimatedMinutes: 30,
        priority: "Low",
        completed: false
    });
    service.addStudyTasks.mockResolvedValue([
        {
            completed: false,
            dueDate: "2026-09-01",
            estimatedMinutes: 30,
            id: "weekly-task",
            priority: "High",
            quizId: "quiz-1",
            subject: "Biology",
            taskType: "quiz",
            title: "Retake Biology Quiz"
        }
    ]);
    service.applyStudyTaskChanges.mockResolvedValue({
        addedTasks: [],
        deletedTaskIds: [],
        updatedTasks: []
    });
    service.toggleStudyTask.mockResolvedValue();
    service.updateStudyTask.mockResolvedValue();
    service.deleteStudyTask.mockResolvedValue();
    service.deleteStudyTasks.mockResolvedValue();
    flashcards.getFlashcardDecks.mockResolvedValue([]);
    quizzes.getQuizzes.mockResolvedValue([]);
    memory.getLearningMemoryOverview.mockResolvedValue([]);
    files.getResourceLibraryData.mockResolvedValue({ resources: [] });
});

test("refreshes planner inputs when connected learning systems change", async () => {
    const { result } = renderHook(() => useStudyPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(quizzes.getQuizzes).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("quizzes-updated"));

    await waitFor(() => expect(quizzes.getQuizzes).toHaveBeenCalledTimes(2));
    expect(memory.getLearningMemoryOverview).toHaveBeenCalledTimes(2);
});

test("atomically adds accepted Thuto weekly blocks", async () => {
    const { result } = renderHook(() => useStudyPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() =>
        result.current.addTasks([
            {
                dueDate: "2026-09-01",
                duration: 30,
                estimatedMinutes: 30,
                priority: "High",
                quizId: "quiz-1",
                subject: "Biology",
                taskType: "quiz",
                title: "Retake Biology Quiz"
            }
        ])
    );

    expect(service.addStudyTasks).toHaveBeenCalledWith("user-1", [
        expect.objectContaining({
            estimatedMinutes: 30,
            quizId: "quiz-1",
            taskType: "quiz"
        })
    ]);
    expect(result.current.tasks[0]).toMatchObject({
        id: "weekly-task",
        title: "Retake Biology Quiz"
    });
});

test("loads the signed-in user's tasks", async () => {
    const { result } = renderHook(() => useStudyPlanner());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(service.getStudyPlanner).toHaveBeenCalledWith("user-1");
    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].estimatedTime).toBe("90 min");
    expect(result.current.tasks[0].notes).toBe("Complete the API section.");
});

test("persists create, update, toggle, and delete actions", async () => {
    const { result } = renderHook(() => useStudyPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tomorrow = getRelativeDateKey(1);

    await act(() =>
        result.current.addTask({
            title: "Database revision",
            subject: "Database",
            notes: "Review normalisation examples.",
            dueDate: "2026-08-11",
            estimatedTime: "30",
            priority: "Low"
        })
    );
    expect(service.addStudyTask).toHaveBeenCalledWith("user-1", {
        title: "Database revision",
        subject: "Database",
        notes: "Review normalisation examples.",
        dueDate: "2026-08-11",
        estimatedMinutes: 30,
        priority: "Low"
    });

    await act(() =>
        result.current.editTask("new-task", {
            title: "Database final revision",
            subject: "Database Systems",
            notes: "Focus on indexing.",
            dueDate: tomorrow,
            estimatedTime: "50",
            priority: "High"
        })
    );
    expect(service.updateStudyTask).toHaveBeenCalledWith("user-1", "new-task", {
        title: "Database final revision",
        subject: "Database Systems",
        notes: "Focus on indexing.",
        dueDate: tomorrow,
        estimatedMinutes: 50,
        priority: "High"
    });
    expect(result.current.tasks[0]).toEqual(
        expect.objectContaining({
            id: "new-task",
            title: "Database final revision",
            estimatedMinutes: 50,
            estimatedTime: "50 min",
            priority: "High",
            notes: "Focus on indexing.",
            dueGroup: "tomorrow",
            dueLabel: "Tomorrow"
        })
    );

    await act(() => result.current.toggleTask("programming-assignment"));
    expect(service.toggleStudyTask).toHaveBeenCalledWith(
        "user-1",
        "programming-assignment",
        true
    );
    expect(result.current.progress).toBe(67);

    await act(() => result.current.deleteTask("robotics-review"));
    expect(service.deleteStudyTask).toHaveBeenCalledWith(
        "user-1",
        "robotics-review"
    );
    expect(result.current.tasks.map((task) => task.id)).not.toContain(
        "robotics-review"
    );

    await act(() => result.current.clearCompleted());
    expect(service.deleteStudyTasks).toHaveBeenCalledWith("user-1", [
        "programming-assignment"
    ]);
    expect(result.current.completedTasks).toBe(0);
});

test("keeps completed past-due tasks out of Overdue and totals active time", async () => {
    service.getStudyPlanner.mockResolvedValueOnce({
        tasks: [
            {
                id: "past-task",
                title: "Past task",
                subject: "History",
                notes: "",
                dueDate: getRelativeDateKey(-2),
                estimatedMinutes: 75,
                priority: "High",
                completed: false
            },
            {
                id: "today-task",
                title: "Today task",
                subject: "Science",
                notes: "",
                dueDate: getRelativeDateKey(0),
                estimatedMinutes: 30,
                priority: "Medium",
                completed: false
            }
        ]
    });

    const { result } = renderHook(() => useStudyPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activeStudyMinutes).toBe(105);
    expect(result.current.todayStudyMinutes).toBe(30);

    await act(() => result.current.toggleTask("past-task"));

    expect(
        result.current.tasks.find((task) => task.id === "past-task")
    ).toEqual(
        expect.objectContaining({ completed: true, dueGroup: "completed" })
    );
    expect(result.current.activeStudyMinutes).toBe(30);
});
