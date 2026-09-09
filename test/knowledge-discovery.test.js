import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Discover is a first-class protected StudentHub route", () => {
    assert.match(read("src/config/routes.js"), /DISCOVER: "\/app\/discover"/);
    assert.match(read("src/routes/AppRouter.jsx"), /<DiscoverPage/);
    assert.match(
        read("src/components/layout/Sidebar/Sidebar.jsx"),
        /label: "Discover"/
    );
});

test("discovery covers every requested knowledge type and transparent ranking", () => {
    const model = read("src/features/discovery/models/discover-result.js");
    for (const type of [
        "resource",
        "question",
        "collection",
        "quiz",
        "flashcard_set",
        "community"
    ]) {
        assert.match(model, new RegExp(`"${type}"`));
    }
    assert.match(model, /relevance \* 0\.6/);
    assert.match(model, /helpfulness \* 0\.25/);
    assert.match(model, /freshness \* 0\.15/);
});

test("community knowledge is bounded by membership before catalog creation", () => {
    const service = read(
        "src/features/discovery/services/discovery-service.js"
    );
    assert.match(service, /getCommunityMembershipIds/);
    assert.match(
        service,
        /accessibleCommunityIds\.has\(resource\.communityId\)/
    );
    assert.match(service, /accessibleCommunityIds\.has\(communityId\)/);
});

test("Discover reuses resource and collection Thuto context services", () => {
    const context = read(
        "src/features/discovery/services/discover-study-context.js"
    );
    const page = read("src/features/discovery/DiscoverPage.jsx");
    assert.match(context, /createCollectionStudyContext/);
    assert.match(context, /loadResourceContext/);
    assert.match(page, /Study with Thuto/);
    assert.match(page, /AIAssistantDialog/);
});
