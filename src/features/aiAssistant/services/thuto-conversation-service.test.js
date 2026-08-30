import { beforeEach, expect, test, vi } from "vitest";

const firestore = vi.hoisted(() => ({
    collection: vi.fn((parent, name) => ({
        path: `${parent.path}/${name}`
    })),
    doc: vi.fn((...parts) => {
        if (parts[0] === "db") {
            return {
                id: parts.at(-1),
                path: parts.slice(1).join("/")
            };
        }
        const [parent, id = "generated-message"] = parts;
        return { id, path: `${parent.path}/${id}` };
    }),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((value) => ["limit", value]),
    orderBy: vi.fn((...parts) => ["orderBy", ...parts]),
    query: vi.fn((reference) => reference),
    serverTimestamp: vi.fn(() => "server-time"),
    setDoc: vi.fn(),
    updateDoc: vi.fn()
}));

vi.mock("firebase/firestore", () => firestore);
vi.mock("../../../firebase/index.js", () => ({ db: "db" }));

import {
    addThutoMessage,
    loadThutoConversation,
    startNewThutoConversation
} from "./thuto-conversation-service.js";

const resource = { id: "science/general/file-1", title: "Motion notes" };

beforeEach(() => {
    vi.clearAllMocks();
    firestore.getDoc.mockResolvedValue({
        data: () => ({ activeThreadId: "thread-1" }),
        exists: () => true
    });
    firestore.getDocs.mockResolvedValue({ docs: [] });
});

test("loads only the active conversation for a resource", async () => {
    firestore.getDocs.mockResolvedValue({
        docs: [
            {
                data: () => ({
                    content: "Newest answer",
                    createdAt: {
                        toDate: () => new Date("2026-08-29T10:01:00Z")
                    },
                    role: "assistant",
                    threadId: "thread-1"
                }),
                id: "message-2"
            },
            {
                data: () => ({
                    content: "Old conversation",
                    createdAt: {
                        toDate: () => new Date("2026-08-29T09:00:00Z")
                    },
                    role: "user",
                    threadId: "thread-old"
                }),
                id: "old-message"
            },
            {
                data: () => ({
                    content: "Question",
                    createdAt: {
                        toDate: () => new Date("2026-08-29T10:00:00Z")
                    },
                    role: "user",
                    threadId: "thread-1"
                }),
                id: "message-1"
            }
        ]
    });

    await expect(loadThutoConversation("user-1", resource)).resolves.toEqual({
        messages: [
            expect.objectContaining({ content: "Question", id: "message-1" }),
            expect.objectContaining({
                content: "Newest answer",
                id: "message-2"
            })
        ],
        threadId: "thread-1"
    });
});

test("stores role, content, thread, and timestamp under the resource", async () => {
    await addThutoMessage("user-1", resource, "thread-1", {
        content: " What is acceleration? ",
        role: "user"
    });

    expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generated-message" }),
        {
            content: "What is acceleration?",
            createdAt: "server-time",
            role: "user",
            threadId: "thread-1"
        }
    );
    expect(firestore.doc).toHaveBeenCalledWith(
        "db",
        "users",
        "user-1",
        "thutoConversations",
        "science%2Fgeneral%2Ffile-1"
    );
});

test("starts a new active thread without deleting stored messages", async () => {
    await expect(
        startNewThutoConversation("user-1", resource)
    ).resolves.toMatchObject({ messages: [], threadId: expect.any(String) });

    expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({
            path: "users/user-1/thutoConversations/science%2Fgeneral%2Ffile-1"
        }),
        expect.objectContaining({ activeThreadId: expect.any(String) })
    );
});
