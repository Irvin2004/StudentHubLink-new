import { runLocalAI } from "./local-ai-provider.js";

const MIN_CONTENT_LENGTH = 30;
const MAX_CONTENT_LENGTH = 12000;

function clean(value) {
    return String(value || "").trim();
}

export async function runAIAssistant(input, provider = runLocalAI) {
    const action = clean(input?.action);
    const subject = clean(input?.subject);
    const content = clean(input?.content);

    if (!action)
        throw new TypeError("Choose what you want the assistant to do.");
    if (!subject) throw new TypeError("Add a subject or topic.");
    if (content.length < MIN_CONTENT_LENGTH) {
        throw new TypeError("Add at least 30 characters of notes or context.");
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        throw new TypeError("Keep notes under 12,000 characters for now.");
    }

    try {
        const result = await provider({ action, content, subject });
        if (!result)
            throw new Error("The assistant returned an empty response.");
        return result;
    } catch (error) {
        if (error instanceof TypeError) throw error;
        const normalized = new Error(
            "The assistant could not complete that request. Please try again."
        );
        normalized.cause = error;
        normalized.code = error?.code || "ai/request-failed";
        throw normalized;
    }
}
