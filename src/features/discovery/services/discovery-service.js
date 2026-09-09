import {
    getCommunityQuestions,
    getQuestionAnswer
} from "../../communityQuestions/services/community-question-service.js";
import { getFlashcardDecks } from "../../flashcards/services/flashcard-service.js";
import { getKnowledgeCollections } from "../../knowledgeCollections/services/knowledge-collection-service.js";
import { getQuizLibraryData } from "../../quizzes/services/quiz-service.js";
import {
    getCommunitiesPage,
    getCommunity,
    getCommunityMembershipIds
} from "../../../services/community-service.js";
import {
    getMoreResourceLibraryData,
    getResourceLibraryData
} from "../../../services/file-service.js";
import { getCommunityReputations } from "../../../services/community-reputation-service.js";
import {
    createDiscoverResult,
    DISCOVER_TYPES
} from "../models/discover-result.js";

const RESOURCE_PAGE_LIMIT = 8;

function fulfilledValues(results) {
    return results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
}

function communityMap(communities) {
    return new Map(communities.map((community) => [community.id, community]));
}

function contributorReputation(reputations, communityId, userId) {
    return reputations.get(communityId)?.get(userId)?.points || 0;
}

async function loadAllResources(userId) {
    const library = await getResourceLibraryData(userId);
    const resources = [...library.resources];
    const known = new Set(resources.map((resource) => resource.resourceKey));
    let cursors = library.cursors || {};
    let hasMore = library.hasMore;

    for (
        let pageIndex = 1;
        hasMore && pageIndex < RESOURCE_PAGE_LIMIT;
        pageIndex += 1
    ) {
        const page = await getMoreResourceLibraryData(
            library.destinations,
            cursors
        );
        page.resources.forEach((resource) => {
            if (!known.has(resource.resourceKey)) {
                known.add(resource.resourceKey);
                resources.push(resource);
            }
        });
        cursors = { ...cursors, ...page.cursors };
        hasMore = page.hasMore && page.resources.length > 0;
    }
    return resources;
}

async function loadCommunityContent(communityId) {
    const [questionsResult, collectionsResult] = await Promise.allSettled([
        getCommunityQuestions(communityId),
        getKnowledgeCollections(communityId)
    ]);
    const questions =
        questionsResult.status === "fulfilled"
            ? questionsResult.value.filter(
                  (question) => question.status === "solved"
              )
            : [];
    const collections =
        collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
    const enrichedQuestions = await Promise.all(
        questions.map(async (question) => ({
            ...question,
            acceptedAnswer: await getQuestionAnswer(
                communityId,
                question.id,
                question.acceptedAnswerId
            ).catch(() => null)
        }))
    );
    return { collections, communityId, questions: enrichedQuestions };
}

async function loadReputations(memberCommunityIds, content, resources) {
    const results = await Promise.allSettled(
        memberCommunityIds.map(async (communityId) => {
            const communityContent = content.find(
                (item) => item.communityId === communityId
            );
            const userIds = [
                ...(communityContent?.questions || []).map(
                    (question) => question.authorId
                ),
                ...(communityContent?.collections || []).map(
                    (collection) => collection.createdBy
                ),
                ...resources
                    .filter((resource) => resource.communityId === communityId)
                    .map((resource) => resource.uploadedBy)
            ];
            return [
                communityId,
                await getCommunityReputations(communityId, userIds)
            ];
        })
    );
    return new Map(fulfilledValues(results));
}

export function buildDiscoverCatalog({
    collectionsByCommunity = [],
    communities = [],
    decks = [],
    memberCommunityIds = [],
    questionsByCommunity = [],
    quizzes = [],
    reputations = new Map(),
    resources = [],
    user = null
} = {}) {
    const accessibleCommunityIds = new Set(memberCommunityIds);
    const visibleCommunities = communities.filter(
        (community) =>
            community.visibility === "public" ||
            accessibleCommunityIds.has(community.id)
    );
    const communitiesById = communityMap(visibleCommunities);
    const results = [];

    visibleCommunities.forEach((community) => {
        results.push(
            createDiscoverResult({
                communityId: community.id,
                communityName: community.name,
                createdAt: community.createdAt,
                description: community.description,
                helpfulness: community.memberCount,
                id: `community:${community.id}`,
                signals: [`${community.memberCount || 0} members`],
                source: community,
                subject: community.category,
                tags: [community.category],
                title: community.name,
                type: DISCOVER_TYPES.COMMUNITY,
                updatedAt: community.updatedAt,
                url: `/community/${community.id}`
            })
        );
    });

    resources
        .filter((resource) => accessibleCommunityIds.has(resource.communityId))
        .forEach((resource) => {
            const community = communitiesById.get(resource.communityId);
            const reputation = contributorReputation(
                reputations,
                resource.communityId,
                resource.uploadedBy
            );
            results.push(
                createDiscoverResult({
                    communityId: resource.communityId,
                    communityName: resource.communityName || community?.name,
                    contributorId: resource.uploadedBy,
                    contributorName: resource.uploadedByName,
                    contributorReputation: reputation,
                    createdAt: resource.uploadedAt,
                    description: resource.originalName,
                    id: `resource:${resource.resourceKey}`,
                    signals: [
                        reputation
                            ? `${reputation} contributor reputation`
                            : "",
                        resource.extension
                            ? resource.extension.toUpperCase()
                            : "Study resource"
                    ],
                    source: resource,
                    studyEligible: true,
                    subject: resource.tags?.[0] || community?.category,
                    tags: resource.tags,
                    title: resource.title,
                    type: DISCOVER_TYPES.RESOURCE,
                    updatedAt: resource.uploadedAt,
                    url: `/app/resources?resource=${encodeURIComponent(resource.resourceKey)}`
                })
            );
        });

    questionsByCommunity
        .filter(({ communityId }) => accessibleCommunityIds.has(communityId))
        .forEach(({ communityId, questions }) => {
            const community = communitiesById.get(communityId);
            questions.forEach((question) => {
                const reputation = contributorReputation(
                    reputations,
                    communityId,
                    question.authorId
                );
                const helpfulness =
                    Number(question.upvoteCount || 0) +
                    Number(question.answerCount || 0) * 2 +
                    5;
                results.push(
                    createDiscoverResult({
                        communityId,
                        communityName: community?.name,
                        contributorId: question.authorId,
                        contributorName: question.authorName,
                        contributorReputation: reputation,
                        createdAt: question.createdAt,
                        description: question.description,
                        helpfulness,
                        id: `question:${communityId}:${question.id}`,
                        signals: [
                            "Accepted answer",
                            `${question.upvoteCount || 0} helpful votes`,
                            reputation ? `${reputation} reputation` : ""
                        ],
                        source: question,
                        studyEligible: true,
                        subject: question.tags?.[0],
                        tags: question.tags,
                        title: question.title,
                        type: DISCOVER_TYPES.QUESTION,
                        updatedAt: question.updatedAt,
                        url: `/community/${communityId}/questions?question=${encodeURIComponent(question.id)}`
                    })
                );
            });
        });

    collectionsByCommunity
        .filter(({ communityId }) => accessibleCommunityIds.has(communityId))
        .forEach(({ collections, communityId }) => {
            const community = communitiesById.get(communityId);
            collections.forEach((knowledgeCollection) => {
                const reputation = contributorReputation(
                    reputations,
                    communityId,
                    knowledgeCollection.createdBy
                );
                results.push(
                    createDiscoverResult({
                        communityId,
                        communityName: community?.name,
                        contributorId: knowledgeCollection.createdBy,
                        contributorName: knowledgeCollection.createdByName,
                        contributorReputation: reputation,
                        createdAt: knowledgeCollection.createdAt,
                        description: knowledgeCollection.description,
                        helpfulness:
                            Number(knowledgeCollection.itemCount || 0) * 2,
                        id: `collection:${communityId}:${knowledgeCollection.id}`,
                        signals: [
                            `${knowledgeCollection.itemCount || knowledgeCollection.items?.length || 0} curated items`,
                            `${knowledgeCollection.contributors?.length || 1} contributors`,
                            reputation ? `${reputation} curator reputation` : ""
                        ],
                        source: knowledgeCollection,
                        studyEligible: true,
                        subject: knowledgeCollection.tags?.[0],
                        tags: knowledgeCollection.tags,
                        title: knowledgeCollection.title,
                        type: DISCOVER_TYPES.COLLECTION,
                        updatedAt: knowledgeCollection.updatedAt,
                        url: `/community/${communityId}/collections?collection=${encodeURIComponent(knowledgeCollection.id)}`
                    })
                );
            });
        });

    quizzes.forEach((quiz) => {
        const attempts = quiz.attempts || [];
        results.push(
            createDiscoverResult({
                contributorId: user?.uid,
                contributorName: user?.displayName || "You",
                createdAt: quiz.createdAt,
                description: `${quiz.questionCount || 0} questions in your private quiz library.`,
                helpfulness: quiz.questionCount,
                id: `quiz:${quiz.id}`,
                signals: [
                    `${quiz.questionCount || 0} questions`,
                    attempts.length
                        ? `${attempts.length} attempts`
                        : "Not attempted"
                ],
                source: quiz,
                studyEligible: true,
                subject: quiz.subject,
                tags: [quiz.subject],
                title: quiz.title,
                type: DISCOVER_TYPES.QUIZ,
                updatedAt: quiz.updatedAt,
                url: `/app/quizzes?quiz=${encodeURIComponent(quiz.id)}`
            })
        );
    });

    decks.forEach((deck) => {
        results.push(
            createDiscoverResult({
                contributorId: user?.uid,
                contributorName: user?.displayName || "You",
                createdAt: deck.createdAt,
                description: `${deck.cardCount || 0} cards in your private flashcard library.`,
                helpfulness: deck.cardCount,
                id: `flashcard-set:${deck.id}`,
                signals: [
                    `${deck.cardCount || 0} cards`,
                    `${deck.masteryPercentage || 0}% mastered`
                ],
                source: deck,
                studyEligible: true,
                subject: deck.subject,
                tags: [deck.subject],
                title: deck.title,
                type: DISCOVER_TYPES.FLASHCARD_SET,
                updatedAt: deck.updatedAt,
                url: `/app/flashcards?deck=${encodeURIComponent(deck.id)}`
            })
        );
    });
    return results;
}

export async function loadDiscoverCatalog(user) {
    if (!user?.uid) throw new TypeError("Sign in to discover study material.");
    const memberCommunityIds = await getCommunityMembershipIds(user.uid);
    const [
        publicPage,
        memberCommunityResults,
        contentResults,
        resources,
        quizzes,
        decks
    ] = await Promise.all([
        getCommunitiesPage({ visibility: "public", pageSize: 100 }),
        Promise.allSettled(memberCommunityIds.map(getCommunity)),
        Promise.allSettled(memberCommunityIds.map(loadCommunityContent)),
        loadAllResources(user.uid),
        getQuizLibraryData(user.uid),
        getFlashcardDecks(user.uid)
    ]);
    const communities = [
        ...new Map(
            [
                ...publicPage.communities,
                ...fulfilledValues(memberCommunityResults).filter(Boolean)
            ].map((community) => [community.id, community])
        ).values()
    ];
    const content = fulfilledValues(contentResults);
    const reputations = await loadReputations(
        memberCommunityIds,
        content,
        resources
    );
    return buildDiscoverCatalog({
        collectionsByCommunity: content.map((item) => ({
            collections: item.collections,
            communityId: item.communityId
        })),
        communities,
        decks,
        memberCommunityIds,
        questionsByCommunity: content.map((item) => ({
            communityId: item.communityId,
            questions: item.questions
        })),
        quizzes,
        reputations,
        resources,
        user
    });
}
