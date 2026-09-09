import {
    createStudyContext,
    loadResourceContext
} from "../../aiAssistant/services/resource-context.js";
import { getFlashcards } from "../../flashcards/services/flashcard-service.js";
import { createCollectionStudyContext } from "../../knowledgeCollections/services/collection-study-context.js";
import { getQuizQuestions } from "../../quizzes/services/quiz-service.js";
import { DISCOVER_TYPES } from "../models/discover-result.js";

function singleContext(result, content, contextKind) {
    return createStudyContext([
        {
            content,
            contextKind,
            id: result.id,
            subject: result.subject || result.title,
            title: result.title
        }
    ]);
}

export async function createDiscoverStudyContext(result, userId) {
    if (!result?.studyEligible) {
        throw new TypeError("This result cannot be studied with Thuto.");
    }
    if (result.type === DISCOVER_TYPES.RESOURCE) {
        return createStudyContext([await loadResourceContext(result.source)]);
    }
    if (result.type === DISCOVER_TYPES.COLLECTION) {
        return createCollectionStudyContext(result.communityId, result.source);
    }
    if (result.type === DISCOVER_TYPES.QUESTION) {
        const answer = result.source.acceptedAnswer?.content;
        return singleContext(
            result,
            [
                `Solved question: ${result.title}`,
                result.source.description,
                answer ? `Accepted answer: ${answer}` : ""
            ]
                .filter(Boolean)
                .join("\n\n"),
            "solved-question"
        );
    }
    if (result.type === DISCOVER_TYPES.QUIZ) {
        const questions = await getQuizQuestions(userId, result.source.id);
        return singleContext(
            result,
            questions
                .map(
                    (question, index) =>
                        `${index + 1}. ${question.prompt}\nCorrect answer: ${question.options?.[question.correctOptionIndex] || ""}`
                )
                .join("\n\n"),
            "quiz"
        );
    }
    if (result.type === DISCOVER_TYPES.FLASHCARD_SET) {
        const cards = await getFlashcards(userId, result.source.id);
        return singleContext(
            result,
            cards.map((card) => `${card.front} — ${card.back}`).join("\n"),
            "flashcard-set"
        );
    }
    throw new TypeError("This discovery result is not a study material.");
}
