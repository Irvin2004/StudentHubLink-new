import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc
} from "firebase/firestore";

import { db } from "../../../firebase/index.js";

const SESSION_LIMIT = 100;
const DEFAULT_WEEKLY_GOAL_MINUTES = 300;

function sessionsReference(userId) {
    if (!userId) throw new TypeError("A user ID is required.");
    return collection(db, "users", userId, "studySessions");
}

function preferencesReference(userId) {
    if (!userId) throw new TypeError("A user ID is required.");
    return doc(db, "users", userId, "studySettings", "planner");
}

export async function getStudyPreferences(userId) {
    const snapshot = await getDoc(preferencesReference(userId));
    if (!snapshot.exists()) {
        return { weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL_MINUTES };
    }

    return {
        weeklyGoalMinutes: Math.max(
            60,
            Number(snapshot.data().weeklyGoalMinutes) ||
                DEFAULT_WEEKLY_GOAL_MINUTES
        )
    };
}

export async function updateWeeklyStudyGoal(userId, weeklyGoalMinutes) {
    const minutes = Math.min(
        2_400,
        Math.max(60, Math.round(Number(weeklyGoalMinutes) || 0))
    );
    await setDoc(
        preferencesReference(userId),
        {
            updatedAt: serverTimestamp(),
            weeklyGoalMinutes: minutes
        },
        { merge: true }
    );
    return minutes;
}

export async function getStudySessions(userId) {
    const snapshot = await getDocs(
        query(
            sessionsReference(userId),
            orderBy("completedAt", "desc"),
            limit(SESSION_LIMIT)
        )
    );

    return snapshot.docs.map((sessionDocument) => ({
        id: sessionDocument.id,
        ...sessionDocument.data()
    }));
}

export async function completeStudySession(userId, input) {
    const reference = input.sessionId
        ? doc(sessionsReference(userId), String(input.sessionId))
        : doc(sessionsReference(userId));
    const timestamp = serverTimestamp();
    const session = {
        title: String(input.title || "Study Session").trim(),
        subject: String(input.subject || "General").trim(),
        sourceType: ["quiz", "resource", "task"].includes(input.sourceType)
            ? input.sourceType
            : "task",
        actualMinutes: Math.max(
            0,
            Math.round(Number(input.actualMinutes) || 0)
        ),
        durationSeconds: Math.max(
            0,
            Math.round(Number(input.durationSeconds) || 0)
        ),
        startedAt: input.startedAt,
        completedAt: timestamp,
        createdAt: timestamp,
        ...(input.taskId ? { taskId: String(input.taskId) } : {}),
        ...(input.resourceId ? { resourceId: String(input.resourceId) } : {}),
        ...(input.quizId ? { quizId: String(input.quizId) } : {})
    };

    await setDoc(reference, session);

    return { id: reference.id, ...session };
}
