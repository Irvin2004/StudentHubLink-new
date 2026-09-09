import { suggestThutoStudySchedule } from "../../dashboard/utils/thuto-scheduling.js";

const DAY_MS = 86_400_000;
const MAX_RECOMMENDATIONS = 3;

function normalized(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ");
}

function labelsMatch(first, second) {
    const left = normalized(first);
    const right = normalized(second);
    return Boolean(
        left && right && (left.includes(right) || right.includes(left))
    );
}

function timestampValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const parsed = new Date(value || 0).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

function daysSince(value, now) {
    const timestamp = timestampValue(value);
    return timestamp
        ? Math.max(0, Math.floor((now.getTime() - timestamp) / DAY_MS))
        : 45;
}

function weakTopic(topic) {
    return (
        topic.level === "struggling" ||
        (Number(topic.latestQuizPercentage) >= 0 &&
            Number(topic.latestQuizPercentage) < 70) ||
        Number(topic.struggleSignals) > Number(topic.correctSignals)
    );
}

function alreadyPlanned(candidate, tasks) {
    return tasks.some(
        (task) =>
            !task.completed &&
            (labelsMatch(task.title, candidate.focus) ||
                (candidate.kind === "topic" &&
                    labelsMatch(task.subject, candidate.subject)))
    );
}

function conceptCandidates(topic, now) {
    return (topic.concepts || [])
        .filter(
            (concept) =>
                concept.level === "struggling" ||
                Number(concept.struggleSignals) > Number(concept.correctSignals)
        )
        .map((concept) => {
            const struggleSignals = Math.max(
                0,
                Number(concept.struggleSignals) || 0
            );
            const correctSignals = Math.max(
                0,
                Number(concept.correctSignals) || 0
            );
            return {
                evidence: `${struggleSignals} struggle signal${struggleSignals === 1 ? "" : "s"} · ${correctSignals} correct`,
                focus: concept.label,
                id: `memory-concept:${topic.id}:${concept.id}`,
                kind: "concept",
                reason: `Your saved ${topic.topic} practice shows that ${concept.label} needs another focused review.`,
                score:
                    120 +
                    (struggleSignals - correctSignals) * 8 -
                    Math.min(12, daysSince(concept.updatedAt, now)),
                subject: topic.topic,
                title: `Review ${concept.label}`,
                weakTopic: true
            };
        });
}

function topicCandidate(topic, now) {
    const weak = weakTopic(topic);
    const inactiveDays = daysSince(topic.updatedAt, now);
    const latestQuizPercentage = Number(topic.latestQuizPercentage);
    const quizGap =
        latestQuizPercentage >= 0 ? Math.max(0, 70 - latestQuizPercentage) : 0;
    if (!weak && inactiveDays < 14) return null;
    const quizEvidence =
        latestQuizPercentage >= 0
            ? `Latest quiz: ${topic.latestQuizPercentage}%`
            : "";
    return {
        evidence:
            quizEvidence ||
            `${Number(topic.struggleSignals) || 0} struggle signals · studied ${Number(topic.studiedCount) || 0} times`,
        focus: topic.topic,
        id: `memory-topic:${topic.id}`,
        kind: "topic",
        reason: weak
            ? `Your learning history identifies ${topic.topic} as a weaker area.`
            : `${topic.topic} has not been revisited for ${inactiveDays} days.`,
        score: weak ? 90 + quizGap : 45 + Math.min(30, inactiveDays),
        subject: topic.topic,
        title: weak ? `Review ${topic.topic}` : `Refresh ${topic.topic}`,
        weakTopic: weak
    };
}

export function generateMemoryPlannerRecommendations(
    { memoryTopics = [], plannerTasks = [] } = {},
    now = new Date()
) {
    const candidates = memoryTopics.flatMap((topic) => {
        const concepts = conceptCandidates(topic, now);
        const broadTopic = topicCandidate(topic, now);
        return [
            ...concepts,
            ...(broadTopic && !concepts.length ? [broadTopic] : [])
        ];
    });
    const unique = new Map();
    candidates
        .filter((candidate) => !alreadyPlanned(candidate, plannerTasks))
        .sort(
            (left, right) =>
                right.score - left.score ||
                left.title.localeCompare(right.title)
        )
        .forEach((candidate) => {
            const key = normalized(candidate.title);
            if (!unique.has(key)) unique.set(key, candidate);
        });

    return [...unique.values()]
        .slice(0, MAX_RECOMMENDATIONS)
        .map((recommendation) => ({
            ...recommendation,
            studyPlan: suggestThutoStudySchedule(
                {
                    ...recommendation,
                    taskType: "study",
                    type: "topic"
                },
                plannerTasks,
                now
            )
        }));
}
