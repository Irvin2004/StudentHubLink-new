import { suggestThutoStudySchedule } from "./thuto-scheduling.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RECOMMENDATIONS = 5;

function timestampValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const time = new Date(value || 0).getTime();
    return Number.isFinite(time) ? time : 0;
}

function normalized(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ");
}

function labelsMatch(first, second) {
    const firstLabel = normalized(first);
    const secondLabel = normalized(second);
    return Boolean(
        firstLabel &&
        secondLabel &&
        (firstLabel.includes(secondLabel) || secondLabel.includes(firstLabel))
    );
}

function daysSince(value, now) {
    const timestamp = timestampValue(value);
    return timestamp
        ? Math.max(0, Math.floor((now.getTime() - timestamp) / DAY_MS))
        : 30;
}

function daysUntil(dateKey, now) {
    if (!dateKey) return 30;
    const dueDate = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(dueDate.getTime())) return 30;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);
}

function deadlineReason(days) {
    if (days < 0)
        return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
}

function latestAttempt(quiz) {
    return [...(quiz.attempts || [])].sort(
        (first, second) =>
            timestampValue(second.completedAt || second.submittedAt) -
            timestampValue(first.completedAt || first.submittedAt)
    )[0];
}

function isWeakTopic(topic) {
    return (
        topic.level === "struggling" ||
        (topic.latestQuizPercentage >= 0 && topic.latestQuizPercentage < 70) ||
        Number(topic.struggleSignals) > Number(topic.correctSignals)
    );
}

function recentActivityPenalty(label, memoryTopics, sessions, now) {
    const topic = memoryTopics.find((item) => labelsMatch(item.topic, label));
    const session = sessions
        .filter((item) => labelsMatch(item.subject, label))
        .sort(
            (first, second) =>
                timestampValue(second.completedAt) -
                timestampValue(first.completedAt)
        )[0];
    const mostRecent = Math.max(
        timestampValue(topic?.updatedAt),
        timestampValue(session?.completedAt)
    );
    const days = daysSince(mostRecent, now);
    return days <= 2 ? 18 : days <= 7 ? 8 : 0;
}

function plannerCandidates(tasks, now) {
    return tasks
        .filter((task) => !task.completed)
        .map((task) => {
            const dueInDays = daysUntil(task.dueDate, now);
            const deadlineScore =
                dueInDays < 0
                    ? 42
                    : dueInDays <= 1
                      ? 36
                      : dueInDays <= 7
                        ? 22
                        : 5;
            const target =
                task.taskType === "quiz" && task.quizId
                    ? {
                          feature: "quiz",
                          id: task.quizId,
                          kind: "route",
                          mode: "take",
                          taskId: task.id
                      }
                    : task.taskType === "flashcards" && task.flashcardDeckId
                      ? {
                            feature: "flashcards",
                            id: task.flashcardDeckId,
                            kind: "route",
                            mode: "due"
                        }
                      : { feature: "planner", id: task.id, kind: "route" };
            return {
                actionLabel:
                    target.feature === "quiz"
                        ? "Take quiz"
                        : target.feature === "flashcards"
                          ? "Review cards"
                          : "Open task",
                alreadyPlanned: true,
                dueDate: task.dueDate,
                estimatedMinutes: Number(task.estimatedMinutes) || 30,
                flashcardDeckId: task.flashcardDeckId,
                id: `planner:${task.id}`,
                priority: task.priority,
                quizId: task.quizId,
                reason: `${deadlineReason(dueInDays)} · ${task.priority || "Medium"} priority`,
                resourceId: task.resourceId,
                score: 50 + deadlineScore + (task.priority === "High" ? 10 : 0),
                subject: task.subject,
                taskType: task.taskType || "study",
                target,
                title: `Complete ${task.title}`,
                type: "planner"
            };
        });
}

function quizCandidates(quizzes, memoryTopics, sessions, now) {
    return quizzes.map((quiz) => {
        const attempt = latestAttempt(quiz);
        const latestScore = attempt
            ? Math.max(0, Number(attempt.percentage) || 0)
            : null;
        const weakMemory = memoryTopics.some(
            (topic) =>
                labelsMatch(topic.topic, quiz.subject) && isWeakTopic(topic)
        );
        const poorScore = latestScore !== null && latestScore < 70;
        const penalty = recentActivityPenalty(
            quiz.subject,
            memoryTopics,
            sessions,
            now
        );
        return {
            actionLabel: attempt ? "Retake quiz" : "Take quiz",
            id: `quiz:${quiz.id}`,
            quizId: quiz.id,
            reason: poorScore
                ? `Latest score was ${latestScore}%`
                : weakMemory
                  ? `${quiz.subject || "This topic"} needs more practice`
                  : "Available for a knowledge check",
            score:
                (poorScore ? 72 + (70 - latestScore) * 0.5 : 34) +
                (weakMemory ? 16 : 0) -
                penalty,
            subject: quiz.subject,
            taskType: "quiz",
            target: {
                feature: "quiz",
                id: quiz.id,
                kind: "route",
                mode: "take"
            },
            title: `${attempt ? "Retake" : "Take"} ${quiz.title}`,
            type: "quiz",
            weakTopic: weakMemory || poorScore
        };
    });
}

function flashcardCandidates(decks, memoryTopics, sessions, now) {
    return decks
        .filter(
            (deck) => Number(deck.dueCount) > 0 || Number(deck.cardCount) > 0
        )
        .map((deck) => {
            const dueCount = Math.max(0, Number(deck.dueCount) || 0);
            const count = Math.min(20, dueCount || Number(deck.cardCount) || 0);
            const weakMemory = memoryTopics.some(
                (topic) =>
                    labelsMatch(topic.topic, deck.subject) && isWeakTopic(topic)
            );
            return {
                actionLabel: "Review flashcards",
                flashcardDeckId: deck.id,
                id: `flashcards:${deck.id}`,
                reason: dueCount
                    ? `${dueCount} card${dueCount === 1 ? " is" : "s are"} due for review`
                    : "This deck is ready to practise",
                score:
                    48 +
                    Math.min(28, dueCount * 2) +
                    (weakMemory ? 15 : 0) -
                    recentActivityPenalty(
                        deck.subject,
                        memoryTopics,
                        sessions,
                        now
                    ),
                subject: deck.subject,
                taskType: "flashcards",
                target: {
                    feature: "flashcards",
                    id: deck.id,
                    kind: "route",
                    mode: dueCount ? "due" : undefined
                },
                title: `Complete ${count} flashcard${count === 1 ? "" : "s"} from ${deck.title}`,
                type: "flashcards",
                weakTopic: weakMemory
            };
        });
}

function resourceCandidates(resources, memoryTopics, sessions, now) {
    return resources.map((resource) => {
        const label = resource.title || resource.communityName;
        const weakMemory = memoryTopics.some(
            (topic) => labelsMatch(topic.topic, label) && isWeakTopic(topic)
        );
        const neglectedDays = daysSince(resource.lastOpened, now);
        return {
            actionLabel: "Open resource",
            id: `resource:${resource.resourceKey || resource.id}`,
            reason: weakMemory
                ? "Your learning memory shows this topic needs review"
                : resource.lastOpened
                  ? `Not opened for ${neglectedDays} days`
                  : "You haven’t studied this material yet",
            score:
                30 +
                (weakMemory ? 38 : 0) +
                Math.min(18, Math.max(0, neglectedDays - 7)),
            resourceId: resource.resourceKey || resource.id,
            subject: resource.subject || resource.communityName || label,
            taskType: "study",
            target: {
                feature: "resource",
                id: resource.resourceKey || resource.id,
                kind: "route"
            },
            title: `Study ${resource.title || resource.originalName || "this resource"}`,
            type: "resource",
            weakTopic: weakMemory
        };
    });
}

function topicCandidates(memoryTopics, sessions, now) {
    return memoryTopics.map((topic) => {
        const neglectedDays = daysSince(topic.updatedAt, now);
        const weak = isWeakTopic(topic);
        return {
            actionLabel: "Start 30 minutes",
            id: `topic:${topic.id || normalized(topic.topic)}`,
            reason: weak
                ? topic.latestQuizPercentage >= 0 &&
                  topic.latestQuizPercentage < 70
                    ? `Latest quiz evidence is ${topic.latestQuizPercentage}%`
                    : "Saved practice shows this is a weak topic"
                : `Not studied for ${neglectedDays} days`,
            score:
                (weak ? 76 : 38 + Math.min(24, neglectedDays)) -
                recentActivityPenalty(topic.topic, memoryTopics, sessions, now),
            subject: topic.topic,
            taskType: "study",
            target: {
                kind: "start-session",
                subject: topic.topic,
                title: `Thuto focus: ${topic.topic}`
            },
            title: weak
                ? `Review ${topic.topic}`
                : `Spend 30 minutes on ${topic.topic}`,
            type: "topic",
            weakTopic: weak
        };
    });
}

export function generateThutoRecommendations(
    {
        flashcardDecks = [],
        memoryTopics = [],
        plannerTasks = [],
        quizzes = [],
        resources = [],
        sessions = []
    } = {},
    now = new Date()
) {
    const activeTasks = plannerTasks.filter((task) => !task.completed);
    const plannedQuizIds = new Set(
        activeTasks.map((task) => task.quizId).filter(Boolean)
    );
    const plannedDeckIds = new Set(
        activeTasks.map((task) => task.flashcardDeckId).filter(Boolean)
    );
    const plannedResourceIds = new Set(
        activeTasks.map((task) => task.resourceId).filter(Boolean)
    );

    const candidates = [
        ...plannerCandidates(plannerTasks, now),
        ...quizCandidates(quizzes, memoryTopics, sessions, now).filter(
            (candidate) => !plannedQuizIds.has(candidate.quizId)
        ),
        ...flashcardCandidates(
            flashcardDecks,
            memoryTopics,
            sessions,
            now
        ).filter((candidate) => !plannedDeckIds.has(candidate.flashcardDeckId)),
        ...resourceCandidates(resources, memoryTopics, sessions, now).filter(
            (candidate) => !plannedResourceIds.has(candidate.resourceId)
        ),
        ...topicCandidates(memoryTopics, sessions, now).filter(
            (candidate) =>
                !activeTasks.some(
                    (task) =>
                        normalized(task.title) === normalized(candidate.title)
                )
        )
    ]
        .filter((candidate) => Number.isFinite(candidate.score))
        .sort(
            (first, second) =>
                second.score - first.score ||
                first.title.localeCompare(second.title)
        );

    const selected = [];
    const targets = new Set();
    for (const candidate of candidates) {
        const targetKey = `${candidate.target.kind}:${candidate.target.feature || candidate.target.subject}:${candidate.target.id || ""}`;
        if (targets.has(targetKey)) continue;
        targets.add(targetKey);
        selected.push(candidate);
        if (selected.length === MAX_RECOMMENDATIONS) break;
    }
    return selected.map((recommendation) =>
        recommendation.alreadyPlanned
            ? recommendation
            : {
                  ...recommendation,
                  studyPlan: suggestThutoStudySchedule(
                      recommendation,
                      plannerTasks,
                      now
                  )
              }
    );
}
