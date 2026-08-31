import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { type: "server-timestamp" }
}));

vi.mock("firebase/firestore", () => ({
    collection: (...parts) => ({
        path: parts.map((part) => part.path || part).join("/")
    }),
    doc: (...parts) => ({
        id: String(parts.at(-1)),
        path: parts.map((part) => part.path || part).join("/")
    }),
    getDoc: mocks.getDoc,
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc
}));
vi.mock("../firebase/index.js", () => ({ db: { path: "db" } }));

import {
    createCommunityTopicTag,
    flagQuestionAsDuplicate
} from "./community-trust-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDoc.mockResolvedValue({ exists: () => false });
    mocks.setDoc.mockResolvedValue();
});

describe("community trust service", () => {
    test("creates a normalized canonical topic tag with its author", async () => {
        await createCommunityTopicTag(
            "community-1",
            { displayName: "Neo", id: "user-1" },
            "  Organic   Chemistry "
        );

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "organic_chemistry" }),
            expect.objectContaining({
                createdBy: "user-1",
                label: "organic chemistry"
            })
        );
    });

    test("appends a non-destructive duplicate flag for moderator review", async () => {
        await flagQuestionAsDuplicate(
            "community-1",
            { id: "question-1", title: "How do limits work?" },
            { displayName: "Neo", id: "user-1" }
        );

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "question-1_user-1" }),
            expect.objectContaining({
                createdBy: "user-1",
                questionId: "question-1",
                status: "open",
                type: "possible_duplicate"
            })
        );
    });
});
