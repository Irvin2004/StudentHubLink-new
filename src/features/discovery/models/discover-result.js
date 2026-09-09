export const DISCOVER_TYPES = Object.freeze({
    COLLECTION: "collection",
    COMMUNITY: "community",
    FLASHCARD_SET: "flashcard_set",
    QUESTION: "question",
    QUIZ: "quiz",
    RESOURCE: "resource"
});

export const DISCOVER_TYPE_LABELS = Object.freeze({
    [DISCOVER_TYPES.COLLECTION]: "Knowledge collection",
    [DISCOVER_TYPES.COMMUNITY]: "Community",
    [DISCOVER_TYPES.FLASHCARD_SET]: "Flashcard set",
    [DISCOVER_TYPES.QUESTION]: "Solved question",
    [DISCOVER_TYPES.QUIZ]: "Quiz",
    [DISCOVER_TYPES.RESOURCE]: "Resource"
});

function clean(value) {
    return String(value || "").trim();
}

function normalize(value) {
    return clean(value)
        .normalize("NFKC")
        .toLocaleLowerCase("en")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function milliseconds(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
}

export function createDiscoverResult(input = {}) {
    const type = clean(input.type);
    if (!Object.values(DISCOVER_TYPES).includes(type)) {
        throw new TypeError("A supported discovery content type is required.");
    }
    const title = clean(input.title);
    if (!title) throw new TypeError("A discovery result title is required.");
    return Object.freeze({
        communityId: clean(input.communityId),
        communityName: clean(input.communityName),
        contributorId: clean(input.contributorId),
        contributorName: clean(input.contributorName),
        contributorReputation: Math.max(
            0,
            Number(input.contributorReputation) || 0
        ),
        createdAt: input.createdAt || null,
        description: clean(input.description),
        helpfulness: Math.max(0, Number(input.helpfulness) || 0),
        id: clean(input.id) || `${type}:${title}`,
        signals: Object.freeze(
            (input.signals || []).map(clean).filter(Boolean).slice(0, 3)
        ),
        source: input.source || null,
        studyEligible: input.studyEligible === true,
        subject: clean(input.subject),
        tags: Object.freeze([
            ...new Set((input.tags || []).map(normalize).filter(Boolean))
        ]),
        title,
        type,
        updatedAt: input.updatedAt || input.createdAt || null,
        url: clean(input.url)
    });
}

function relevanceScore(result, query) {
    const term = normalize(query);
    if (!term) return 0.5;
    const tokens = term.split(" ");
    const title = normalize(result.title);
    const searchable = normalize(
        [
            result.title,
            result.description,
            result.subject,
            result.communityName,
            result.contributorName,
            ...result.tags
        ].join(" ")
    );
    if (title === term) return 1;
    if (title.startsWith(term)) return 0.95;
    const matches = tokens.filter((token) => searchable.includes(token)).length;
    if (!matches) return 0;
    return Math.min(0.9, 0.35 + (matches / tokens.length) * 0.55);
}

function freshnessScore(result, now) {
    const age = Math.max(0, now - milliseconds(result.updatedAt));
    const ageInDays = age / 86_400_000;
    return Math.max(0, 1 - ageInDays / 365);
}

export function filterAndRankDiscoverResults(
    results = [],
    filters = {},
    now = Date.now()
) {
    const selectedTypes = Array.isArray(filters.types)
        ? filters.types
        : filters.type && filters.type !== "all"
          ? [filters.type]
          : [];
    const query = clean(filters.query);
    const filtered = results.filter((result) => {
        if (selectedTypes.length && !selectedTypes.includes(result.type)) {
            return false;
        }
        if (
            filters.community &&
            filters.community !== "all" &&
            result.communityId !== filters.community
        ) {
            return false;
        }
        if (filters.subject && filters.subject !== "all") {
            const subject = normalize(filters.subject);
            if (
                normalize(result.subject) !== subject &&
                !result.tags.includes(subject)
            ) {
                return false;
            }
        }
        return relevanceScore(result, query) > 0;
    });

    const scored = filtered.map((result) => {
        const relevance = relevanceScore(result, query);
        const helpfulness = Math.min(
            1,
            (Math.log1p(result.helpfulness) +
                Math.log1p(result.contributorReputation) * 0.35) /
                8
        );
        const freshness = freshnessScore(result, now);
        return {
            ...result,
            ranking: Object.freeze({
                freshness,
                helpfulness,
                relevance,
                score: relevance * 0.6 + helpfulness * 0.25 + freshness * 0.15
            })
        };
    });

    const sort = filters.sort || "relevance";
    return scored.sort((left, right) => {
        if (sort === "newest") {
            return milliseconds(right.updatedAt) - milliseconds(left.updatedAt);
        }
        if (sort === "helpful") {
            return (
                right.ranking.helpfulness - left.ranking.helpfulness ||
                right.ranking.score - left.ranking.score
            );
        }
        return (
            right.ranking.score - left.ranking.score ||
            milliseconds(right.updatedAt) - milliseconds(left.updatedAt)
        );
    });
}
