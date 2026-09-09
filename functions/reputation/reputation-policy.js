const REPUTATION_POINTS = Object.freeze({
    ACCEPTED_ANSWER: 15,
    ANSWER_UPVOTE: 3,
    HELPFUL_QUESTION: 2,
    CONSTRUCTIVE_DAY: 1
});

const REPUTATION_LEVELS = Object.freeze([
    Object.freeze({ label: "Expert", minimum: 200 }),
    Object.freeze({ label: "Helper", minimum: 75 }),
    Object.freeze({ label: "Contributor", minimum: 25 }),
    Object.freeze({ label: "Newcomer", minimum: 0 })
]);

const BADGE_DEFINITIONS = Object.freeze([
    Object.freeze({
        id: "first_helpful_answer",
        label: "First Helpful Answer",
        metric: "answerUpvotes",
        target: 1
    }),
    Object.freeze({
        id: "accepted_answers_10",
        label: "10 Accepted Answers",
        metric: "acceptedAnswers",
        target: 10
    }),
    Object.freeze({
        id: "answer_upvotes_50",
        label: "50 Upvotes",
        metric: "answerUpvotes",
        target: 50
    }),
    Object.freeze({
        id: "resource_contributor",
        label: "Resource Contributor",
        metric: "resourceContributions",
        target: 1
    }),
    Object.freeze({
        id: "consistent_helper",
        label: "Consistent Helper",
        metric: "constructiveDays",
        target: 7
    })
]);

const TRUST_LEVELS = Object.freeze([
    Object.freeze({
        capabilities: Object.freeze([
            "create_topic_tags",
            "flag_duplicate_questions",
            "access_curation_tools"
        ]),
        label: "Community Curator",
        minimumPoints: 250,
        rank: 3,
        requirements: Object.freeze({
            acceptedAnswers: 10,
            answerUpvotes: 25,
            resourceContributions: 1
        })
    }),
    Object.freeze({
        capabilities: Object.freeze([
            "create_topic_tags",
            "flag_duplicate_questions"
        ]),
        label: "Community Guide",
        minimumPoints: 125,
        rank: 2,
        requirements: Object.freeze({
            acceptedAnswers: 5,
            answerUpvotes: 10
        })
    }),
    Object.freeze({
        capabilities: Object.freeze(["create_topic_tags"]),
        label: "Trusted Contributor",
        minimumPoints: 50,
        rank: 1,
        requirements: Object.freeze({ acceptedAnswers: 1 })
    }),
    Object.freeze({
        capabilities: Object.freeze([]),
        label: "Community Member",
        minimumPoints: 0,
        rank: 0,
        requirements: Object.freeze({})
    })
]);

const EMPTY_CONTRIBUTION_STATS = Object.freeze({
    acceptedAnswers: 0,
    answerUpvotes: 0,
    constructiveDays: 0,
    helpfulQuestions: 0,
    resourceContributions: 0
});

const EVENT_METRICS = Object.freeze({
    accepted_answer: ["acceptedAnswers", 1],
    accepted_answer_reversed: ["acceptedAnswers", -1],
    answer_upvote: ["answerUpvotes", 1],
    answer_upvote_reversed: ["answerUpvotes", -1],
    constructive_day: ["constructiveDays", 1],
    constructive_day_reversed: ["constructiveDays", -1],
    question_upvote: ["helpfulQuestions", 1],
    question_upvote_reversed: ["helpfulQuestions", -1],
    resource_contributed: ["resourceContributions", 1],
    resource_contribution_reversed: ["resourceContributions", -1]
});

function normalizeContributionStats(stats = {}) {
    return Object.fromEntries(
        Object.keys(EMPTY_CONTRIBUTION_STATS).map((metric) => [
            metric,
            Math.max(0, Number(stats[metric]) || 0)
        ])
    );
}

function applyContributionEvent(stats = {}, type) {
    const next = normalizeContributionStats(stats);
    const change = EVENT_METRICS[type];
    if (change) next[change[0]] = Math.max(0, next[change[0]] + change[1]);
    return next;
}

function calculateContributionStats(events = []) {
    const totals = { ...EMPTY_CONTRIBUTION_STATS };
    events.forEach((event) => {
        const change = EVENT_METRICS[event.type];
        if (change) totals[change[0]] += change[1];
    });
    return normalizeContributionStats(totals);
}

function deriveRecognition(points = 0, contributionStats = {}) {
    const score = Math.max(0, Number(points) || 0);
    const stats = normalizeContributionStats(contributionStats);
    const badgeProgress = BADGE_DEFINITIONS.map((badge) => ({
        ...badge,
        current: Math.min(badge.target, stats[badge.metric]),
        earned: stats[badge.metric] >= badge.target
    }));
    const trust = TRUST_LEVELS.find(
        (level) =>
            score >= level.minimumPoints &&
            Object.entries(level.requirements).every(
                ([metric, target]) => stats[metric] >= target
            )
    );
    return {
        badgeProgress,
        badges: badgeProgress
            .filter((badge) => badge.earned)
            .map((badge) => badge.id),
        capabilities: [...trust.capabilities],
        contributionStats: stats,
        trustLevel: trust.label,
        trustRank: trust.rank
    };
}

function getReputationLevel(points = 0) {
    const score = Math.max(0, Number(points) || 0);
    return REPUTATION_LEVELS.find((level) => score >= level.minimum).label;
}

function calculateReputation(events = []) {
    return Math.max(
        0,
        events.reduce((total, event) => total + Number(event.points || 0), 0)
    );
}

module.exports = {
    applyContributionEvent,
    BADGE_DEFINITIONS,
    calculateReputation,
    calculateContributionStats,
    deriveRecognition,
    EMPTY_CONTRIBUTION_STATS,
    getReputationLevel,
    REPUTATION_LEVELS,
    REPUTATION_POINTS,
    TRUST_LEVELS
};
