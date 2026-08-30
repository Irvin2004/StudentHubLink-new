import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Community Q&A is routed inside the React community workspace", () => {
    const routes = read("src/config/routes.js");
    const router = read("src/routes/AppRouter.jsx");
    const page = read("src/pages/community/CommunityPage.jsx");

    assert.match(routes, /COMMUNITY_QUESTIONS/);
    assert.match(router, /CommunityQuestionsPage/);
    assert.match(page, /Questions & Answers/);
    assert.match(page, /CommunityQuestions/);
});

test("Community Q&A exposes states, resource links, answers, comments, and votes", () => {
    const model = read(
        "src/features/communityQuestions/models/community-question.js"
    );
    const service = read(
        "src/features/communityQuestions/services/community-question-service.js"
    );
    const board = read(
        "src/features/communityQuestions/components/CommunityQuestions.jsx"
    );

    for (const status of ["unanswered", "answered", "solved"]) {
        assert.match(model, new RegExp(`"${status}"`));
    }
    assert.match(service, /toggleAnswerUpvote/);
    assert.match(service, /acceptAnswer/);
    assert.match(service, /subscribeToComments/);
    assert.match(service, /getCommunityQuestionResources/);
    assert.match(board, /Accepted Answer/);
    assert.match(board, /Linked material/);
});

test("Firestore enforces Q&A authorship and community moderation", () => {
    const rules = read("firestore.rules");
    const questionRules = rules.slice(
        rules.indexOf("match /questions/{questionId}"),
        rules.indexOf("match /channels/{channelId}")
    );

    assert.match(questionRules, /isCommunityMember\(communityId\)/);
    assert.match(questionRules, /questionAuthor\(\)/);
    assert.match(questionRules, /answerAuthor\(\)/);
    assert.match(questionRules, /commentAuthor\(\)/);
    assert.match(questionRules, /questionOwner\(\)/);
    assert.match(questionRules, /isCommunityModerator\(communityId\)/);
    assert.match(questionRules, /match \/upvotes\/\{userId\}/);
});
