import { createFlashcardDeckWithCards } from "../../flashcards/services/flashcard-service.js";
import { createQuizWithQuestions } from "../../quizzes/services/quiz-service.js";
import { addStudyTasks } from "../../studyPlanner/services/study-planner-service.js";

export async function saveAIResult(userId, result) {
    if (!userId)
        throw new TypeError("Sign in before saving generated study material.");

    if (result.kind === "flashcards") {
        const deck = await createFlashcardDeckWithCards(userId, result);
        window.dispatchEvent(new Event("flashcards-updated"));
        return { count: result.cards.length, id: deck.id, kind: result.kind };
    }

    if (result.kind === "quiz") {
        const quiz = await createQuizWithQuestions(userId, result);
        window.dispatchEvent(new Event("quizzes-updated"));
        return {
            count: result.questions.length,
            id: quiz.id,
            kind: result.kind
        };
    }

    if (result.kind === "study-plan") {
        const tasks = await addStudyTasks(userId, result.tasks);
        window.dispatchEvent(new Event("study-plan-updated"));
        return { count: tasks.length, kind: result.kind };
    }

    throw new TypeError("This Thuto response does not need to be saved.");
}
