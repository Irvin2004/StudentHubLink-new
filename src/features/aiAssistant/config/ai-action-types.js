export const AI_ACTIONS = Object.freeze({
    ASK_QUESTION: "ask-question",
    EXPLAIN_TOPIC: "explain-topic",
    GENERATE_FLASHCARDS: "generate-flashcards",
    GENERATE_QUIZ: "generate-quiz",
    STUDY_PLAN: "study-plan",
    SUMMARISE_NOTES: "summarise-notes"
});

export const AI_ACTION_OPTIONS = Object.freeze([
    { id: AI_ACTIONS.SUMMARISE_NOTES, label: "Summarise with Thuto" },
    { id: AI_ACTIONS.EXPLAIN_TOPIC, label: "Explain with Thuto" },
    { id: AI_ACTIONS.ASK_QUESTION, label: "Ask a Question" },
    { id: AI_ACTIONS.GENERATE_FLASHCARDS, label: "Create Flashcards" },
    { id: AI_ACTIONS.GENERATE_QUIZ, label: "Create a Quiz" },
    { id: AI_ACTIONS.STUDY_PLAN, label: "Plan My Study" }
]);

export function getAIActionLabel(action) {
    return (
        AI_ACTION_OPTIONS.find((option) => option.id === action)?.label ||
        "Ask Thuto"
    );
}
