import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
    calculateContributionStats,
    calculateReputation,
    deriveRecognition,
    getReputationLevel,
    REPUTATION_POINTS
} = require("../functions/reputation/reputation-policy.js");
const read = (path) => readFileSync(path, "utf8");

test("reputation rewards usefulness more than raw posting volume", () => {
    assert.deepEqual(REPUTATION_POINTS, {
        ACCEPTED_ANSWER: 15,
        ANSWER_UPVOTE: 3,
        CONSTRUCTIVE_DAY: 1,
        HELPFUL_QUESTION: 2
    });
    assert.equal(getReputationLevel(0), "Newcomer");
    assert.equal(getReputationLevel(25), "Contributor");
    assert.equal(getReputationLevel(75), "Helper");
    assert.equal(getReputationLevel(200), "Expert");
});

test("badges and trust require meaningful contribution evidence", () => {
    const events = [
        { type: "answer_upvote" },
        { type: "accepted_answer" },
        { type: "resource_contributed" },
        { type: "constructive_day" },
        { type: "answer_upvote_reversed" }
    ];
    const stats = calculateContributionStats(events);
    assert.deepEqual(stats, {
        acceptedAnswers: 1,
        answerUpvotes: 0,
        constructiveDays: 1,
        helpfulQuestions: 0,
        resourceContributions: 1
    });
    assert.equal(
        calculateContributionStats([
            { type: "answer_upvote_reversed" },
            { type: "answer_upvote" }
        ]).answerUpvotes,
        0
    );

    const pointsOnly = deriveRecognition(300, {});
    assert.equal(pointsOnly.trustLevel, "Community Member");
    assert.deepEqual(pointsOnly.capabilities, []);

    const trusted = deriveRecognition(60, {
        acceptedAnswers: 1,
        answerUpvotes: 1
    });
    assert.equal(trusted.trustLevel, "Trusted Contributor");
    assert.deepEqual(trusted.badges, ["first_helpful_answer"]);
    assert.ok(trusted.capabilities.includes("create_topic_tags"));
    assert.ok(!trusted.capabilities.includes("delete_content"));
});

test("event totals can be audited, reversed, and recalculated", () => {
    assert.equal(
        calculateReputation([
            { points: 15 },
            { points: 3 },
            { points: 1 },
            { points: -3 }
        ]),
        16
    );
    assert.equal(calculateReputation([{ points: -15 }]), 0);

    const functions = read("functions/reputation/reputation-functions.js");
    assert.match(functions, /reputationEvents/);
    assert.match(functions, /accepted_answer_reversed/);
    assert.match(functions, /reputationSignals/);
    assert.match(functions, /lastEventMillis/);
    assert.match(functions, /constructive_day_reversed/);
    assert.match(functions, /recalculateCommunityReputation/);
    assert.match(functions, /where\("userId", "==", userId\)/);
    assert.match(functions, /eventSnapshot\.exists/);
    assert.match(functions, /onQuestionDeleted/);
    assert.match(functions, /recursiveDelete\(event\.data\.before\.ref\)/);
    assert.match(functions, /onCommunityResourceCreated/);
    assert.match(functions, /resource_contribution_reversed/);
});

test("reputation summaries and ledgers are server-owned community data", () => {
    const rules = read("firestore.rules");
    const start = rules.indexOf("match /reputation/{userId}");
    const block = rules.slice(
        start,
        rules.indexOf("match /questions/{questionId}", start)
    );
    assert.match(block, /allow read: if isCommunityMember\(communityId\)/);
    assert.match(block, /allow create, update, delete: if false/);
    assert.match(rules, /match \/reputationSignals\/\{signalId\}/);
    assert.match(rules, /match \/topicTags\/\{tagId\}/);
    assert.match(rules, /match \/curationFlags\/\{flagId\}/);
    assert.match(rules, /hasCommunityTrust\(communityId, 2\)/);
    assert.match(rules, /allow delete: if isCommunityModerator\(communityId\)/);
    assert.match(rules, /recipientId != request\.auth\.uid/);
});

test("community profiles and Q&A expose levels and the local leaderboard", () => {
    const members = read(
        "src/components/communities/CommunityMembers/CommunityMembers.jsx"
    );
    const questions = read(
        "src/features/communityQuestions/components/CommunityQuestions.jsx"
    );
    const leaderboard = read(
        "src/features/communityReputation/components/CommunityLeaderboard.jsx"
    );
    assert.match(members, /reputationPoints/);
    assert.match(members, /reputationLevel/);
    assert.match(questions, /CommunityLeaderboard/);
    assert.match(leaderboard, /Top contributors/);
    assert.match(leaderboard, /current\.points/);
    const trust = read(
        "src/features/communityReputation/components/CommunityTrustPanel.jsx"
    );
    assert.match(trust, /badgeProgress/);
    assert.match(trust, /retain final authority/);
    assert.match(trust, /Community curation queue/);
});
