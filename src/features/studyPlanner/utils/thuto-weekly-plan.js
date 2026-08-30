const MAX_PROPOSED_BLOCKS = 10;

function dateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function addDays(date, days) {
    const result = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
    result.setDate(result.getDate() + days);
    return result;
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

function taskMinutes(task) {
    return Math.max(
        0,
        Number(task.estimatedMinutes) || parseInt(task.estimatedTime, 10) || 0
    );
}

function timestampValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const result = new Date(value || 0).getTime();
    return Number.isFinite(result) ? result : 0;
}

function latestQuizScore(quiz) {
    const attempt = [...(quiz.attempts || [])].sort(
        (first, second) =>
            timestampValue(second.completedAt || second.submittedAt) -
            timestampValue(first.completedAt || first.submittedAt)
    )[0];
    return attempt ? Math.max(0, Number(attempt.percentage) || 0) : null;
}

function isWeakTopic(topic) {
    return (
        topic.level === "struggling" ||
        (Number(topic.latestQuizPercentage) >= 0 &&
            Number(topic.latestQuizPercentage) < 70) ||
        Number(topic.struggleSignals) > Number(topic.correctSignals)
    );
}

function linkedFields(item) {
    return {
        ...(item.resourceId ? { resourceId: item.resourceId } : {}),
        ...(item.quizId ? { quizId: item.quizId } : {}),
        ...(item.flashcardDeckId
            ? { flashcardDeckId: item.flashcardDeckId }
            : {})
    };
}

function closestSubjectDeadline(subject, tasks, todayKey) {
    return tasks
        .filter(
            (task) =>
                !task.completed &&
                task.dueDate &&
                labelsMatch(task.subject, subject)
        )
        .map((task) => (task.dueDate < todayKey ? todayKey : task.dueDate))
        .sort()[0];
}

function buildCandidates({
    flashcardDecks,
    memoryTopics,
    plannerTasks,
    quizzes,
    resources,
    todayKey
}) {
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
    const candidates = [];

    memoryTopics.forEach((topic) => {
        const weak = isWeakTopic(topic);
        const title = weak ? `Review ${topic.topic}` : `Revise ${topic.topic}`;
        if (
            activeTasks.some(
                (task) => normalized(task.title) === normalized(title)
            )
        ) {
            return;
        }
        candidates.push({
            deadline: closestSubjectDeadline(
                topic.topic,
                activeTasks,
                todayKey
            ),
            duration: 30,
            id: `topic:${topic.id || normalized(topic.topic)}`,
            priority: weak ? "High" : "Medium",
            reason: weak
                ? topic.latestQuizPercentage >= 0
                    ? `Your latest quiz evidence for this topic is ${topic.latestQuizPercentage}%.`
                    : "Your learning memory shows this is a weaker topic."
                : "This topic would benefit from another revision session.",
            score: weak ? 112 : 54,
            subject: topic.topic,
            taskType: "study",
            title
        });
    });

    quizzes.forEach((quiz) => {
        if (plannedQuizIds.has(quiz.id)) return;
        const latestScore = latestQuizScore(quiz);
        const poorScore = latestScore !== null && latestScore < 70;
        candidates.push({
            deadline: closestSubjectDeadline(
                quiz.subject,
                activeTasks,
                todayKey
            ),
            duration: 30,
            id: `quiz:${quiz.id}`,
            priority: poorScore ? "High" : "Medium",
            quizId: quiz.id,
            reason: poorScore
                ? `Your latest result was ${latestScore}%, so another attempt is a priority.`
                : "Use this quiz as a knowledge check for the week.",
            score: poorScore ? 105 + (70 - latestScore) / 2 : 48,
            subject: quiz.subject || "General",
            taskType: "quiz",
            title: `${latestScore === null ? "Take" : "Retake"} ${quiz.title}`
        });
    });

    flashcardDecks.forEach((deck) => {
        const dueCount = Math.max(0, Number(deck.dueCount) || 0);
        if (!dueCount || plannedDeckIds.has(deck.id)) return;
        candidates.push({
            deadline: closestSubjectDeadline(
                deck.subject,
                activeTasks,
                todayKey
            ),
            duration: dueCount >= 20 ? 40 : 25,
            flashcardDeckId: deck.id,
            id: `flashcards:${deck.id}`,
            priority: dueCount >= 20 ? "High" : "Medium",
            reason: `${dueCount} flashcard${dueCount === 1 ? " is" : "s are"} due for review.`,
            score: 72 + Math.min(25, dueCount),
            subject: deck.subject || "General",
            taskType: "flashcards",
            title: `Review ${Math.min(20, dueCount)} flashcards from ${deck.title}`
        });
    });

    resources.forEach((resource) => {
        const resourceId = resource.resourceKey || resource.id;
        if (!resourceId || plannedResourceIds.has(resourceId)) return;
        const label =
            resource.subject || resource.communityName || resource.title;
        const weak = memoryTopics.some(
            (topic) => labelsMatch(topic.topic, label) && isWeakTopic(topic)
        );
        const unopened = !timestampValue(resource.lastOpened);
        if (!weak && !unopened) return;
        candidates.push({
            deadline: closestSubjectDeadline(label, activeTasks, todayKey),
            duration: 45,
            id: `resource:${resourceId}`,
            priority: weak ? "High" : "Low",
            reason: weak
                ? "This material supports one of your weaker topics."
                : "You have not studied this resource yet.",
            resourceId,
            score: weak ? 88 : 42,
            subject: label || "General",
            taskType: "study",
            title: `Study ${resource.title || resource.originalName || "resource"}`
        });
    });

    return candidates.sort(
        (first, second) =>
            Boolean(second.deadline) - Boolean(first.deadline) ||
            second.score - first.score ||
            first.title.localeCompare(second.title)
    );
}

function existingReason(task, todayKey) {
    if (task.dueDate < todayKey) return "Already planned and overdue.";
    if (task.dueDate === todayKey) return "Already planned and due today.";
    return `Already in your planner for ${task.dueDate}.`;
}

export function generateThutoWeeklyPlan(
    {
        availableMinutes = 300,
        flashcardDecks = [],
        memoryTopics = [],
        plannerTasks = [],
        quizzes = [],
        resources = []
    } = {},
    now = new Date()
) {
    const dates = Array.from({ length: 7 }, (_, index) => addDays(now, index));
    const dateKeys = dates.map(dateKey);
    const todayKey = dateKeys[0];
    const endKey = dateKeys.at(-1);
    const minutesAvailable = Math.max(0, Number(availableMinutes) || 0);
    const dailyCap = Math.min(
        120,
        Math.max(45, Math.ceil(minutesAvailable / 5 / 15) * 15)
    );
    const blocks = [];
    const load = new Map(dateKeys.map((key) => [key, 0]));

    plannerTasks
        .filter((task) => !task.completed && task.dueDate <= endKey)
        .forEach((task) => {
            const dueDate = task.dueDate < todayKey ? todayKey : task.dueDate;
            if (!load.has(dueDate)) return;
            const duration = taskMinutes(task);
            load.set(dueDate, load.get(dueDate) + duration);
            blocks.push({
                ...linkedFields(task),
                dueDate,
                duration,
                existing: true,
                id: `existing:${task.id}`,
                priority: task.priority || "Medium",
                reason: existingReason(task, todayKey),
                selected: false,
                subject: task.subject || "General",
                taskId: task.id,
                taskType: task.taskType || "study",
                title: task.title
            });
        });

    const existingMinutes = [...load.values()].reduce(
        (total, minutes) => total + minutes,
        0
    );
    let remainingMinutes = Math.max(0, minutesAvailable - existingMinutes);
    const candidates = buildCandidates({
        flashcardDecks,
        memoryTopics,
        plannerTasks,
        quizzes,
        resources,
        todayKey
    });
    let proposedCount = 0;

    for (const candidate of candidates) {
        if (proposedCount >= MAX_PROPOSED_BLOCKS || remainingMinutes < 15) {
            break;
        }
        const duration = Math.min(candidate.duration, remainingMinutes);
        if (duration < 15) continue;
        const fittingDates = dateKeys.filter(
            (key) => load.get(key) + duration <= dailyCap
        );
        const beforeDeadline = fittingDates.filter(
            (key) => !candidate.deadline || key <= candidate.deadline
        );
        const eligibleDates = (
            beforeDeadline.length ? beforeDeadline : fittingDates
        ).sort((first, second) => {
            const loadDifference = load.get(first) - load.get(second);
            if (loadDifference) return loadDifference;
            return first.localeCompare(second);
        });
        const dueDate = eligibleDates[0];
        if (!dueDate) continue;

        load.set(dueDate, load.get(dueDate) + duration);
        remainingMinutes -= duration;
        proposedCount += 1;
        blocks.push({
            ...linkedFields(candidate),
            dueDate,
            duration,
            existing: false,
            id: candidate.id,
            priority: candidate.priority,
            reason: candidate.reason,
            selected: true,
            subject: candidate.subject,
            taskType: candidate.taskType,
            title: candidate.title
        });
    }

    const days = dateKeys.map((key, index) => ({
        blocks: blocks.filter((block) => block.dueDate === key),
        date: key,
        dayLabel: dates[index].toLocaleDateString(undefined, {
            weekday: "long"
        })
    }));
    const proposedMinutes = blocks
        .filter((block) => !block.existing)
        .reduce((total, block) => total + block.duration, 0);

    return {
        blocks,
        days,
        summary: {
            availableMinutes: minutesAvailable,
            dailyCap,
            existingMinutes,
            proposedMinutes
        }
    };
}

export default generateThutoWeeklyPlan;
