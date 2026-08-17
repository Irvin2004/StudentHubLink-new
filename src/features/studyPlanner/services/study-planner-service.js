import {
    collection,
    deleteField,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch
} from "firebase/firestore";

import { db } from "../../../firebase/index.js";
import { isDateKey } from "../utils/task-grouping.js";

const TASK_LIMIT = 500;

function studyTasksReference(userId) {
    if (!userId) throw new TypeError("A user ID is required.");
    return collection(db, "users", userId, "studyTasks");
}

function studyTaskReference(userId, taskId) {
    if (!taskId) throw new TypeError("A task ID is required.");
    return doc(studyTasksReference(userId), taskId);
}

function requireDueDate(value) {
    const dueDate = String(value || "");
    if (!isDateKey(dueDate)) {
        throw new TypeError("A valid due date is required.");
    }
    return dueDate;
}

export async function getStudyPlanner(userId) {
    const snapshot = await getDocs(
        query(
            studyTasksReference(userId),
            orderBy("createdAt", "desc"),
            limit(TASK_LIMIT)
        )
    );

    return {
        tasks: snapshot.docs.map((taskDocument) => ({
            id: taskDocument.id,
            ...taskDocument.data()
        }))
    };
}

export async function addStudyTask(userId, taskInput) {
    const reference = doc(studyTasksReference(userId));
    const timestamp = serverTimestamp();
    const task = {
        title: taskInput.title,
        subject: taskInput.subject,
        notes: String(taskInput.notes || "").trim(),
        dueDate: requireDueDate(taskInput.dueDate),
        estimatedMinutes: Number(taskInput.estimatedMinutes),
        priority: taskInput.priority,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(taskInput.resourceId
            ? { resourceId: String(taskInput.resourceId) }
            : {}),
        ...(taskInput.flashcardDeckId
            ? { flashcardDeckId: String(taskInput.flashcardDeckId) }
            : {}),
        ...(taskInput.quizId ? { quizId: String(taskInput.quizId) } : {}),
        ...(taskInput.taskType ? { taskType: String(taskInput.taskType) } : {})
    };

    await setDoc(reference, task);

    return {
        id: reference.id,
        ...task
    };
}

export async function toggleStudyTask(userId, taskId, completed) {
    await updateDoc(studyTaskReference(userId, taskId), {
        completed,
        updatedAt: serverTimestamp()
    });
}

export async function updateStudyTask(userId, taskId, changes) {
    const taskChanges = {
        title: changes.title,
        subject: changes.subject,
        notes: String(changes.notes || "").trim(),
        dueDate: requireDueDate(changes.dueDate),
        estimatedMinutes: Number(changes.estimatedMinutes),
        priority: changes.priority,
        updatedAt: serverTimestamp()
    };
    if (Object.hasOwn(changes, "flashcardDeckId")) {
        taskChanges.flashcardDeckId = changes.flashcardDeckId
            ? String(changes.flashcardDeckId)
            : deleteField();
    }
    if (Object.hasOwn(changes, "taskType")) {
        taskChanges.taskType = String(changes.taskType || "study");
    }
    if (Object.hasOwn(changes, "quizId")) {
        taskChanges.quizId = changes.quizId
            ? String(changes.quizId)
            : deleteField();
    }

    await updateDoc(studyTaskReference(userId, taskId), taskChanges);

    return taskChanges;
}

export async function deleteStudyTask(userId, taskId) {
    await deleteDoc(studyTaskReference(userId, taskId));
}

export async function deleteStudyTasks(userId, taskIds) {
    const uniqueTaskIds = [...new Set(taskIds.filter(Boolean))];

    for (let index = 0; index < uniqueTaskIds.length; index += 500) {
        const batch = writeBatch(db);
        uniqueTaskIds
            .slice(index, index + 500)
            .forEach((taskId) =>
                batch.delete(studyTaskReference(userId, taskId))
            );
        await batch.commit();
    }
}
