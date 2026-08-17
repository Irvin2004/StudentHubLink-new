import {
    createFlashcard,
    createFlashcardDeck
} from "../../flashcards/services/flashcard-service.js";
import {
    createQuiz,
    createQuizQuestion
} from "../../quizzes/services/quiz-service.js";
import { addStudyTask } from "../../studyPlanner/services/study-planner-service.js";

export async function saveAIResult(userId, result) {
    if (!userId)
        throw new TypeError("Sign in before saving generated study material.");

    if (result.kind === "flashcards") {
        const deck = await createFlashcardDeck(userId, result);
        await Promise.all(
            result.cards.map((card) => createFlashcard(userId, deck.id, card))
        );
        window.dispatchEvent(new Event("flashcards-updated"));
        return { count: result.cards.length, id: deck.id, kind: result.kind };
    }

    if (result.kind === "quiz") {
        const quiz = await createQuiz(userId, result);
        for (const question of result.questions) {
            await createQuizQuestion(userId, quiz.id, {
                ...question,
                questionCount: result.questions.length
            });
        }
        window.dispatchEvent(new Event("quizzes-updated"));
        return {
            count: result.questions.length,
            id: quiz.id,
            kind: result.kind
        };
    }

    if (result.kind === "study-plan") {
        const tasks = await Promise.all(
            result.tasks.map((task) => addStudyTask(userId, task))
        );
        window.dispatchEvent(new Event("study-planner-updated"));
        return { count: tasks.length, kind: result.kind };
    }

    throw new TypeError("This AI response does not need to be saved.");
}
