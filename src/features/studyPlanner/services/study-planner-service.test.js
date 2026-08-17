import { beforeEach, expect, test, vi } from "vitest";

const firebase = vi.hoisted(() => ({
    collection: vi.fn(),
    deleteField: vi.fn(() => ({ type: "delete-field" })),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    writeBatch: vi.fn(),
    batchDelete: vi.fn(),
    batchCommit: vi.fn()
}));

vi.mock("firebase/firestore", () => firebase);
vi.mock("../../../firebase/index.js", () => ({ db: { name: "test-db" } }));

import {
    addStudyTask,
    deleteStudyTask,
    deleteStudyTasks,
    getStudyPlanner,
    toggleStudyTask,
    updateStudyTask
} from "./study-planner-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    firebase.collection.mockReturnValue({ path: "users/user-1/studyTasks" });
    firebase.doc.mockImplementation((reference, id) => ({
        id: id || "generated-task-id",
        path: `${reference.path}/${id || "generated-task-id"}`
    }));
    firebase.orderBy.mockReturnValue({ field: "createdAt", direction: "desc" });
    firebase.query.mockImplementation((reference, constraint) => ({
        reference,
        constraint
    }));
    firebase.serverTimestamp.mockReturnValue({ type: "server-timestamp" });
    firebase.setDoc.mockResolvedValue();
    firebase.updateDoc.mockResolvedValue();
    firebase.deleteDoc.mockResolvedValue();
    firebase.batchCommit.mockResolvedValue();
    firebase.writeBatch.mockReturnValue({
        commit: firebase.batchCommit,
        delete: firebase.batchDelete
    });
});

test("loads tasks from the user's studyTasks collection", async () => {
    firebase.getDocs.mockResolvedValue({
        docs: [
            {
                id: "task-1",
                data: () => ({ title: "Read chapter 2", completed: false })
            }
        ]
    });

    const result = await getStudyPlanner("user-1");

    expect(firebase.collection).toHaveBeenCalledWith(
        { name: "test-db" },
        "users",
        "user-1",
        "studyTasks"
    );
    expect(firebase.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(result.tasks).toEqual([
        { id: "task-1", title: "Read chapter 2", completed: false }
    ]);
});

test("adds, updates, toggles, and deletes a task document", async () => {
    await addStudyTask("user-1", {
        title: "Read chapter 2",
        subject: "Biology",
        notes: "Revise the cell diagrams.",
        dueDate: "2026-08-12",
        estimatedMinutes: 40,
        priority: "High",
        resourceId: "science:general:resource-1",
        flashcardDeckId: "deck-1",
        taskType: "flashcards"
    });

    expect(firebase.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generated-task-id" }),
        {
            title: "Read chapter 2",
            subject: "Biology",
            notes: "Revise the cell diagrams.",
            dueDate: "2026-08-12",
            estimatedMinutes: 40,
            priority: "High",
            completed: false,
            createdAt: { type: "server-timestamp" },
            updatedAt: { type: "server-timestamp" },
            resourceId: "science:general:resource-1",
            flashcardDeckId: "deck-1",
            taskType: "flashcards"
        }
    );

    await updateStudyTask("user-1", "task-1", {
        title: "Read chapter 3",
        subject: "Life Sciences",
        notes: "Add chapter 4 questions.",
        dueDate: "2026-08-13",
        estimatedMinutes: 55,
        priority: "Medium"
    });
    expect(firebase.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "users/user-1/studyTasks/task-1" }),
        {
            title: "Read chapter 3",
            subject: "Life Sciences",
            notes: "Add chapter 4 questions.",
            dueDate: "2026-08-13",
            estimatedMinutes: 55,
            priority: "Medium",
            updatedAt: { type: "server-timestamp" }
        }
    );

    await toggleStudyTask("user-1", "task-1", true);
    expect(firebase.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "users/user-1/studyTasks/task-1" }),
        {
            completed: true,
            updatedAt: { type: "server-timestamp" }
        }
    );

    await deleteStudyTask("user-1", "task-1");
    expect(firebase.deleteDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "users/user-1/studyTasks/task-1" })
    );

    await deleteStudyTasks("user-1", ["task-1", "task-2"]);
    expect(firebase.batchDelete).toHaveBeenCalledTimes(2);
    expect(firebase.batchCommit).toHaveBeenCalledOnce();
});
