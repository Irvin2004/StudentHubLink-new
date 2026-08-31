import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("community knowledge collections are routed inside the React workspace", () => {
    const routes = read("src/config/routes.js");
    const router = read("src/routes/AppRouter.jsx");
    const community = read("src/pages/community/CommunityPage.jsx");
    assert.match(routes, /COMMUNITY_COLLECTIONS/);
    assert.match(router, /CommunityKnowledgeCollectionsPage/);
    assert.match(community, /CommunityKnowledgeCollections/);
});

test("collections preserve ordered mixed content and contributor history", () => {
    const model = read(
        "src/features/knowledgeCollections/models/knowledge-collection.js"
    );
    const service = read(
        "src/features/knowledgeCollections/services/knowledge-collection-service.js"
    );
    assert.match(model, /FLASHCARD_SET/);
    assert.match(model, /MAX_COLLECTION_ITEMS = 20/);
    assert.match(service, /contributorsFor/);
    assert.match(service, /reviewCollectionSuggestion/);
    assert.match(service, /toggleCollectionSaved/);
});

test("trusted curation stays additive while moderators retain deletion authority", () => {
    const rules = read("firestore.rules");
    const start = rules.indexOf("match /knowledgeCollections/{collectionId}");
    const block = rules.slice(
        start,
        rules.indexOf("match /questions/{questionId}", start)
    );
    assert.match(block, /canCurateCommunityKnowledge\(communityId\)/);
    assert.match(block, /allow delete: if isCommunityModerator\(communityId\)/);
    assert.match(block, /match \/suggestions\/\{suggestionId\}/);
    assert.match(block, /status in \["approved", "rejected"\]/);
    assert.match(block, /match \/saves\/\{userId\}/);
    assert.match(block, /userId == request\.auth\.uid/);
});

test("collection study uses the existing bounded Thuto multi-resource context", () => {
    const context = read(
        "src/features/knowledgeCollections/services/collection-study-context.js"
    );
    const component = read(
        "src/features/knowledgeCollections/components/CommunityKnowledgeCollections.jsx"
    );
    assert.match(context, /createStudyContext/);
    assert.match(context, /MAX_STUDY_RESOURCES/);
    assert.match(component, /Study this collection with Thuto/);
    assert.match(component, /AIAssistantDialog/);
});
