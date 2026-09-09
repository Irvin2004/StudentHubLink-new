import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const conversations = vi.hoisted(() => ({
    addThutoMessage: vi.fn(),
    loadThutoConversation: vi.fn(),
    startNewThutoConversation: vi.fn()
}));
const assistant = vi.hoisted(() => ({ runAIAssistant: vi.fn() }));
const memory = vi.hoisted(() => ({
    loadLearningMemory: vi.fn(),
    recordThutoLearningMemory: vi.fn()
}));

vi.mock("../services/thuto-conversation-service.js", () => conversations);
vi.mock("../services/ai-assistant-service.js", () => assistant);
vi.mock(
    "../../learningMemory/services/learning-memory-service.js",
    () => memory
);
vi.mock("../services/ai-assistant-persistence.js", () => ({
    saveAIResult: vi.fn()
}));

import { AI_ACTIONS } from "../config/ai-action-types.js";
import { useAIAssistant } from "./useAIAssistant.js";

const motion = {
    content: "Motion context with enough content for the assistant to use.",
    id: "science:motion",
    subject: "Motion notes",
    title: "Motion notes"
};
const algebra = {
    content: "Algebra context with enough content for the assistant to use.",
    id: "maths:algebra",
    subject: "Algebra notes",
    title: "Algebra notes"
};

function deferred() {
    let resolve;
    const promise = new Promise((nextResolve) => {
        resolve = nextResolve;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    conversations.addThutoMessage.mockImplementation(
        async (_userId, _resource, threadId, message) => ({
            ...message,
            createdAt: new Date(),
            id: `${threadId}-${message.role}`,
            threadId
        })
    );
    assistant.runAIAssistant.mockResolvedValue({
        kind: "answer",
        overview: "Acceleration changes velocity.",
        points: ["Acceleration is measured over time."],
        title: "Answer from Motion notes"
    });
    memory.loadLearningMemory.mockResolvedValue({
        notices: [],
        prompt: "",
        topics: []
    });
    memory.recordThutoLearningMemory.mockResolvedValue([]);
});

test("restores the active conversation for a resource", async () => {
    conversations.loadThutoConversation.mockResolvedValue({
        messages: [
            {
                content: "What is acceleration?",
                id: "message-1",
                role: "user",
                threadId: "thread-motion"
            }
        ],
        threadId: "thread-motion"
    });
    const { result } = renderHook(() => useAIAssistant("user-1"));

    act(() => result.current.openAssistant(AI_ACTIONS.ASK_QUESTION, motion));

    await waitFor(() =>
        expect(result.current.conversationMessages).toHaveLength(1)
    );
    expect(result.current.threadId).toBe("thread-motion");
    expect(conversations.loadThutoConversation).toHaveBeenCalledWith(
        "user-1",
        motion
    );
});

test("does not let a slower resource load bleed into another resource", async () => {
    const motionLoad = deferred();
    conversations.loadThutoConversation.mockImplementation(
        (_userId, resource) =>
            resource.id === motion.id
                ? motionLoad.promise
                : Promise.resolve({
                      messages: [
                          {
                              content: "Algebra only",
                              id: "algebra-message",
                              role: "assistant",
                              threadId: "thread-algebra"
                          }
                      ],
                      threadId: "thread-algebra"
                  })
    );
    const { result } = renderHook(() => useAIAssistant("user-1"));

    act(() => result.current.openAssistant(AI_ACTIONS.EXPLAIN_TOPIC, motion));
    act(() => result.current.openAssistant(AI_ACTIONS.EXPLAIN_TOPIC, algebra));
    await waitFor(() => expect(result.current.threadId).toBe("thread-algebra"));

    await act(async () => {
        motionLoad.resolve({
            messages: [
                {
                    content: "Motion only",
                    id: "motion-message",
                    role: "assistant",
                    threadId: "thread-motion"
                }
            ],
            threadId: "thread-motion"
        });
        await motionLoad.promise;
    });

    expect(result.current.context.id).toBe(algebra.id);
    expect(result.current.conversationMessages[0].content).toBe("Algebra only");
});

test("persists both roles and starts a clean active conversation", async () => {
    conversations.loadThutoConversation.mockResolvedValue({
        messages: [],
        threadId: "thread-motion"
    });
    conversations.startNewThutoConversation.mockResolvedValue({
        messages: [],
        threadId: "thread-new"
    });
    const { result } = renderHook(() => useAIAssistant("user-1"));
    act(() => result.current.openAssistant(AI_ACTIONS.ASK_QUESTION, motion));
    await waitFor(() => expect(result.current.threadId).toBe("thread-motion"));

    await act(() =>
        result.current.run({
            action: AI_ACTIONS.ASK_QUESTION,
            content: motion.content,
            question: "What is acceleration?",
            source: motion,
            subject: motion.subject
        })
    );

    expect(conversations.addThutoMessage).toHaveBeenNthCalledWith(
        1,
        "user-1",
        motion,
        "thread-motion",
        { content: "What is acceleration?", role: "user" }
    );
    expect(conversations.addThutoMessage).toHaveBeenNthCalledWith(
        2,
        "user-1",
        motion,
        "thread-motion",
        expect.objectContaining({ role: "assistant" })
    );
    expect(result.current.conversationMessages).toHaveLength(2);

    await act(() => result.current.newConversation());
    expect(result.current.threadId).toBe("thread-new");
    expect(result.current.conversationMessages).toEqual([]);
    expect(result.current.result).toBeNull();
});

test("injects saved learning evidence into Thuto without treating chat as confidence", async () => {
    conversations.loadThutoConversation.mockResolvedValue({
        messages: [],
        threadId: "thread-motion"
    });
    memory.loadLearningMemory.mockResolvedValue({
        notices: ["You struggled with acceleration last time."],
        prompt: "StudentHub learning memory: acceleration has struggle evidence.",
        topics: [{ level: "struggling", topic: "Motion notes" }]
    });
    const { result } = renderHook(() => useAIAssistant("user-1"));
    act(() => result.current.openAssistant(AI_ACTIONS.ASK_QUESTION, motion));
    await waitFor(() =>
        expect(result.current.learningMemoryLoading).toBe(false)
    );

    await act(() =>
        result.current.run({
            action: AI_ACTIONS.ASK_QUESTION,
            content: motion.content,
            question: "What should I revisit?",
            source: motion,
            subject: motion.subject
        })
    );

    expect(assistant.runAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
            content: motion.content,
            learningMemory: expect.stringContaining(
                "StudentHub learning memory: acceleration has struggle evidence."
            )
        })
    );
    expect(memory.recordThutoLearningMemory).toHaveBeenCalledWith(
        "user-1",
        motion,
        AI_ACTIONS.ASK_QUESTION
    );
});
