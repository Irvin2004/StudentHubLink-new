import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    writeBatch
} from "firebase/firestore";

import { db } from "../../../firebase/index.js";

const QUIZ_LIMIT = 50;
const QUESTION_LIMIT = 200;
const ATTEMPT_LIMIT = 100;

function requiredId(value, label) {
    const id = String(value || "").trim();
    if (!id) throw new TypeError(`A ${label} is required.`);
    return id;
}

function cleanText(value) {
    return String(value || "").trim();
}

function quizzesCollection(userId) {
    return collection(db, "users", requiredId(userId, "user ID"), "quizzes");
}

function quizReference(userId, quizId) {
    return doc(quizzesCollection(userId), requiredId(quizId, "quiz ID"));
}

function questionsCollection(userId, quizId) {
    return collection(quizReference(userId, quizId), "questions");
}

function questionReference(userId, quizId, questionId) {
    return doc(
        questionsCollection(userId, quizId),
        requiredId(questionId, "question ID")
    );
}

function attemptsCollection(userId, quizId) {
    return collection(quizReference(userId, quizId), "attempts");
}

async function deleteReferences(references) {
    for (let index = 0; index < references.length; index += 450) {
        const batch = writeBatch(db);
        references
            .slice(index, index + 450)
            .forEach((reference) => batch.delete(reference));
        await batch.commit();
    }
}

async function deleteCollectionDocuments(reference) {
    let hasMore = true;
    while (hasMore) {
        const snapshot = await getDocs(query(reference, limit(450)));
        if (snapshot.empty) return;
        await deleteReferences(snapshot.docs.map((item) => item.ref));
        hasMore = snapshot.size === 450;
    }
}

export async function getQuizzes(userId) {
    const snapshot = await getDocs(
        query(
            quizzesCollection(userId),
            orderBy("updatedAt", "desc"),
            limit(QUIZ_LIMIT)
        )
    );
    return snapshot.docs.map((quizDocument) => ({
        id: quizDocument.id,
        ...quizDocument.data()
    }));
}

export async function getQuizQuestions(userId, quizId) {
    const snapshot = await getDocs(
        query(
            questionsCollection(userId, quizId),
            orderBy("position", "asc"),
            limit(QUESTION_LIMIT)
        )
    );
    return snapshot.docs.map((questionDocument) => ({
        id: questionDocument.id,
        ...questionDocument.data()
    }));
}

export async function getQuizAttempts(userId, quizId) {
    const snapshot = await getDocs(
        query(
            attemptsCollection(userId, quizId),
            orderBy("completedAt", "desc"),
            limit(ATTEMPT_LIMIT)
        )
    );
    return snapshot.docs.map((attemptDocument) => ({
        id: attemptDocument.id,
        ...attemptDocument.data()
    }));
}

export async function getQuizLibraryData(userId) {
    const quizzes = await getQuizzes(userId);
    return Promise.all(
        quizzes.map(async (quiz) => ({
            ...quiz,
            attempts: await getQuizAttempts(userId, quiz.id)
        }))
    );
}

export async function createQuiz(userId, input) {
    const reference = doc(quizzesCollection(userId));
    const timestamp = serverTimestamp();
    const quiz = {
        questionCount: 0,
        subject: cleanText(input.subject),
        title: cleanText(input.title),
        ...(input.flashcardDeckId
            ? { flashcardDeckId: cleanText(input.flashcardDeckId) }
            : {}),
        ...(input.resourceId
            ? { resourceId: cleanText(input.resourceId) }
            : {}),
        createdAt: timestamp,
        updatedAt: timestamp
    };
    await setDoc(reference, quiz);
    return { id: reference.id, ...quiz };
}

export async function createQuizFromFlashcardDeck(userId, deck, questions) {
    const reference = doc(quizzesCollection(userId));
    const timestamp = serverTimestamp();
    const quiz = {
        flashcardDeckId: requiredId(deck.id, "flashcard deck ID"),
        questionCount: questions.length,
        subject: cleanText(deck.subject),
        title: `${cleanText(deck.title)} Quiz`,
        createdAt: timestamp,
        updatedAt: timestamp
    };

    const questionRecords = questions.map((input) => ({
        reference: doc(questionsCollection(userId, reference.id)),
        value: {
            correctOptionIndex: Number(input.correctOptionIndex),
            options: input.options.map(cleanText),
            position: Number(input.position),
            prompt: cleanText(input.prompt),
            sourceFlashcardId: requiredId(
                input.sourceFlashcardId,
                "source flashcard ID"
            ),
            createdAt: timestamp,
            updatedAt: timestamp
        }
    }));
    for (let index = 0; index < questionRecords.length; index += 449) {
        const batch = writeBatch(db);
        if (index === 0) batch.set(reference, quiz);
        questionRecords.slice(index, index + 449).forEach((question) => {
            batch.set(question.reference, question.value);
        });
        await batch.commit();
    }
    if (!questionRecords.length) {
        const batch = writeBatch(db);
        batch.set(reference, quiz);
        await batch.commit();
    }
    return { id: reference.id, ...quiz };
}

export async function createQuizWithQuestions(userId, input) {
    if (
        !Array.isArray(input.questions) ||
        !input.questions.length ||
        input.questions.length > QUESTION_LIMIT
    ) {
        throw new RangeError(
            "Generate between 1 and 200 quiz questions at a time."
        );
    }
    const reference = doc(quizzesCollection(userId));
    const timestamp = serverTimestamp();
    const quiz = {
        questionCount: input.questions.length,
        subject: cleanText(input.subject),
        title: cleanText(input.title),
        ...(input.resourceId
            ? { resourceId: cleanText(input.resourceId) }
            : {}),
        createdAt: timestamp,
        updatedAt: timestamp
    };
    const batch = writeBatch(db);
    batch.set(reference, quiz);
    input.questions.forEach((question, position) => {
        batch.set(doc(questionsCollection(userId, reference.id)), {
            correctOptionIndex: Number(question.correctOptionIndex),
            options: question.options.map(cleanText),
            position,
            prompt: cleanText(question.prompt),
            createdAt: timestamp,
            updatedAt: timestamp
        });
    });
    await batch.commit();
    return { id: reference.id, ...quiz };
}

export async function deleteQuiz(userId, quizId) {
    await Promise.all([
        deleteCollectionDocuments(questionsCollection(userId, quizId)),
        deleteCollectionDocuments(attemptsCollection(userId, quizId))
    ]);
    const batch = writeBatch(db);
    batch.delete(quizReference(userId, quizId));
    await batch.commit();
}

export async function createQuizQuestion(userId, quizId, input) {
    const reference = doc(questionsCollection(userId, quizId));
    const timestamp = serverTimestamp();
    const question = {
        correctOptionIndex: Number(input.correctOptionIndex),
        options: input.options.map(cleanText),
        position: Number(input.position),
        prompt: cleanText(input.prompt),
        ...(input.sourceFlashcardId
            ? { sourceFlashcardId: cleanText(input.sourceFlashcardId) }
            : {}),
        createdAt: timestamp,
        updatedAt: timestamp
    };
    const batch = writeBatch(db);
    batch.set(reference, question);
    batch.update(quizReference(userId, quizId), {
        questionCount: Number(input.questionCount),
        updatedAt: timestamp
    });
    await batch.commit();
    return { id: reference.id, ...question };
}

export async function updateQuizQuestion(userId, quizId, questionId, changes) {
    const timestamp = serverTimestamp();
    const update = {
        correctOptionIndex: Number(changes.correctOptionIndex),
        options: changes.options.map(cleanText),
        prompt: cleanText(changes.prompt),
        updatedAt: timestamp
    };
    const batch = writeBatch(db);
    batch.update(questionReference(userId, quizId, questionId), update);
    batch.update(quizReference(userId, quizId), { updatedAt: timestamp });
    await batch.commit();
    return update;
}

export async function deleteQuizQuestion(
    userId,
    quizId,
    questionId,
    nextQuestionCount
) {
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    batch.delete(questionReference(userId, quizId, questionId));
    batch.update(quizReference(userId, quizId), {
        questionCount: Math.max(0, Number(nextQuestionCount) || 0),
        updatedAt: timestamp
    });
    await batch.commit();
}

export async function saveQuizAttempt(userId, quizId, attempt) {
    const reference = attempt.attemptId
        ? doc(
              attemptsCollection(userId, quizId),
              requiredId(attempt.attemptId, "attempt ID")
          )
        : doc(attemptsCollection(userId, quizId));
    if (attempt.attemptId) {
        const existing = await getDoc(reference);
        if (existing.exists()) {
            return { id: reference.id, ...existing.data() };
        }
    }
    const record = {
        answers: attempt.answers,
        completedAt: serverTimestamp(),
        durationSeconds: Math.max(
            0,
            Math.round(Number(attempt.durationSeconds) || 0)
        ),
        percentage: attempt.percentage,
        quizId,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        ...(attempt.taskId ? { taskId: cleanText(attempt.taskId) } : {})
    };
    await setDoc(reference, record);
    return { id: reference.id, ...record, completedAt: new Date() };
}
