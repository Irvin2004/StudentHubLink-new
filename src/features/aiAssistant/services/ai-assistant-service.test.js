import { describe, expect, test, vi } from "vitest";

import { AI_ACTIONS } from "../config/ai-action-types.js";
import { runAIAssistant } from "./ai-assistant-service.js";

const notes = [
    "A CPU executes instructions and coordinates the main operations of a computer.",
    "RAM temporarily stores data that active programs need to access quickly.",
    "Persistent storage keeps files after the computer has been switched off.",
    "An operating system manages hardware resources and provides services to applications."
].join(" ");

describe("local AI assistant", () => {
    test.each([
        [AI_ACTIONS.SUMMARISE_NOTES, "summary"],
        [AI_ACTIONS.EXPLAIN_TOPIC, "explanation"],
        [AI_ACTIONS.GENERATE_FLASHCARDS, "flashcards"],
        [AI_ACTIONS.GENERATE_QUIZ, "quiz"],
        [AI_ACTIONS.STUDY_PLAN, "study-plan"]
    ])("generates %s responses", async (action, kind) => {
        const result = await runAIAssistant({
            action,
            content: notes,
            subject: "Computer Architecture"
        });

        expect(result).toMatchObject({
            kind,
            subject: "Computer Architecture"
        });
        if (kind === "flashcards")
            expect(result.cards.length).toBeGreaterThan(2);
        if (kind === "quiz") {
            expect(result.questions.length).toBeGreaterThan(2);
            expect(
                result.questions.every((item) => item.options.length === 4)
            ).toBe(true);
        }
        if (kind === "study-plan") expect(result.tasks).toHaveLength(4);
    });

    test("validates short requests before calling a provider", async () => {
        const provider = vi.fn();
        await expect(
            runAIAssistant(
                {
                    action: AI_ACTIONS.SUMMARISE_NOTES,
                    content: "Too short",
                    subject: "Biology"
                },
                provider
            )
        ).rejects.toThrow("at least 30 characters");
        expect(provider).not.toHaveBeenCalled();
    });

    test("normalizes provider failures into a retryable response", async () => {
        await expect(
            runAIAssistant(
                {
                    action: AI_ACTIONS.EXPLAIN_TOPIC,
                    content: notes,
                    subject: "Computing"
                },
                vi.fn().mockRejectedValue(new Error("provider unavailable"))
            )
        ).rejects.toMatchObject({
            code: "ai/request-failed",
            message:
                "The assistant could not complete that request. Please try again."
        });
    });
});
