export const AI_ACTIONS = Object.freeze({
    EXPLAIN_TOPIC: "explain-topic",
    GENERATE_FLASHCARDS: "generate-flashcards",
    GENERATE_QUIZ: "generate-quiz",
    STUDY_PLAN: "study-plan",
    SUMMARISE_NOTES: "summarise-notes"
});

export const AI_ACTION_OPTIONS = Object.freeze([
    { id: AI_ACTIONS.SUMMARISE_NOTES, label: "Summarise Notes" },
    { id: AI_ACTIONS.EXPLAIN_TOPIC, label: "Explain a Topic" },
    { id: AI_ACTIONS.GENERATE_FLASHCARDS, label: "Generate Flashcards" },
    { id: AI_ACTIONS.GENERATE_QUIZ, label: "Generate a Quiz" },
    { id: AI_ACTIONS.STUDY_PLAN, label: "Suggest a Study Plan" }
]);

export function getAIActionLabel(action) {
    return (
        AI_ACTION_OPTIONS.find((option) => option.id === action)?.label ||
        "Ask AI"
    );
}
