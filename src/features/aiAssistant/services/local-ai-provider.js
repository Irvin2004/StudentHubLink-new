import { AI_ACTIONS } from "../config/ai-action-types.js";

const FALLBACK_DISTRACTORS = [
    "It is unrelated to the supplied notes.",
    "It only applies in the opposite situation.",
    "It cannot be determined from the notes."
];

function sentences(content) {
    return String(content || "")
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+|\n+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 12);
}

function unique(items) {
    return [
        ...new Set(items.map((item) => String(item).trim()).filter(Boolean))
    ];
}

function keyPoints(content, count = 5) {
    const source = sentences(content);
    return unique(source)
        .sort((first, second) => second.length - first.length)
        .slice(0, count);
}

function shortTopic(point, subject, index) {
    const match = point.match(
        /^([^,:;]{3,60})\s+(?:is|are|means|refers to)\s+/i
    );
    return match?.[1]?.trim() || `${subject} concept ${index + 1}`;
}

function buildSummary(subject, content) {
    const points = keyPoints(content, 5);
    return {
        action: AI_ACTIONS.SUMMARISE_NOTES,
        kind: "summary",
        subject,
        title: `${subject} summary`,
        overview: points.slice(0, 2).join(" "),
        points
    };
}

function buildExplanation(subject, content) {
    const points = keyPoints(content, 4);
    return {
        action: AI_ACTIONS.EXPLAIN_TOPIC,
        kind: "explanation",
        subject,
        title: `${subject}, explained simply`,
        overview: `${subject} can be understood by connecting these core ideas from your notes.`,
        points: points.map((point, index) =>
            index === 0 ? `Start here: ${point}` : point
        )
    };
}

function buildFlashcards(subject, content) {
    const points = keyPoints(content, 8);
    return {
        action: AI_ACTIONS.GENERATE_FLASHCARDS,
        kind: "flashcards",
        persistable: true,
        subject,
        title: `${subject} Review`,
        cards: points.map((point, index) => ({
            back: point,
            front: `What should you remember about ${shortTopic(point, subject, index)}?`
        }))
    };
}

function buildQuiz(subject, content) {
    const points = keyPoints(content, 8);
    const questions = points.slice(0, 6).map((point, index) => {
        const alternatives = unique([
            ...points.filter((candidate) => candidate !== point),
            ...FALLBACK_DISTRACTORS
        ]).slice(0, 3);
        const correctOptionIndex = index % 4;
        const options = [...alternatives];
        options.splice(correctOptionIndex, 0, point);
        return {
            correctOptionIndex,
            options: options.slice(0, 4),
            position: index,
            prompt: `Which statement about ${shortTopic(point, subject, index)} is supported by your notes?`
        };
    });
    return {
        action: AI_ACTIONS.GENERATE_QUIZ,
        kind: "quiz",
        persistable: true,
        questions,
        subject,
        title: `${subject} Practice Quiz`
    };
}

function dateKey(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function buildStudyPlan(subject, content) {
    const points = keyPoints(content, 4);
    const offsets = [0, 1, 3, 5];
    return {
        action: AI_ACTIONS.STUDY_PLAN,
        kind: "study-plan",
        persistable: true,
        subject,
        title: `${subject} study plan`,
        tasks: offsets.map((offset, index) => ({
            dueDate: dateKey(offset),
            estimatedMinutes: index === 3 ? 45 : 30,
            notes: points[index] || `Review and practise ${subject}.`,
            priority: index < 2 ? "High" : "Medium",
            subject,
            title: [
                "Learn the essentials",
                "Recall key ideas",
                "Practise",
                "Final review"
            ][index]
        }))
    };
}

export async function runLocalAI({ action, content, subject }) {
    const builders = {
        [AI_ACTIONS.EXPLAIN_TOPIC]: buildExplanation,
        [AI_ACTIONS.GENERATE_FLASHCARDS]: buildFlashcards,
        [AI_ACTIONS.GENERATE_QUIZ]: buildQuiz,
        [AI_ACTIONS.STUDY_PLAN]: buildStudyPlan,
        [AI_ACTIONS.SUMMARISE_NOTES]: buildSummary
    };
    const builder = builders[action];
    if (!builder) throw new TypeError("Choose a supported AI study action.");
    return builder(subject, content);
}
