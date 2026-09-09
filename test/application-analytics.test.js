import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("application analytics stays behind one hook and service boundary", async () => {
    const [hook, service] = await Promise.all([
        read("src/hooks/useAnalytics.js"),
        read("src/services/analytics-service.js")
    ]);

    assert.match(hook, /track/);
    assert.match(hook, /services\/analytics-service/);
    assert.doesNotMatch(service, /react|firebase|firestore/i);
    assert.match(service, /configureAnalytics/);
});

test("completed product workflows emit the initial analytics events", async () => {
    const sources = await Promise.all(
        [
            "src/pages/auth/LoginPage.jsx",
            "src/pages/communities/CommunitiesPage.jsx",
            "src/components/files/FileUploader/FileUploader.jsx",
            "src/pages/chat/ChatPage.jsx",
            "src/context/SearchContext.jsx",
            "src/pages/notifications/NotificationsPage.jsx"
        ].map(read)
    );
    const combined = sources.join("\n");

    for (const event of [
        "USER_LOGGED_IN",
        "COMMUNITY_JOINED",
        "FILE_UPLOADED",
        "MESSAGE_SENT",
        "SEARCH_PERFORMED",
        "NOTIFICATION_OPENED"
    ]) {
        assert.match(combined, new RegExp(`ANALYTICS_EVENTS\\.${event}`));
    }

    assert.doesNotMatch(
        combined,
        /track\([^)]*\b(email|filename|message|query|text)\s*:/i
    );
});

test("V2 learning workflows emit privacy-safe completion analytics", async () => {
    const sources = await Promise.all(
        [
            "src/features/aiAssistant/hooks/useAIAssistant.js",
            "src/features/quizzes/hooks/useQuizzes.js",
            "src/features/flashcards/hooks/useFlashcards.js",
            "src/features/studySessions/context/StudySessionProvider.jsx",
            "src/features/dashboard/DashboardPage.jsx",
            "src/features/knowledgeCollections/components/CommunityKnowledgeCollections.jsx"
        ].map(read)
    );
    const combined = sources.join("\n");

    for (const event of [
        "THUTO_REQUEST_COMPLETED",
        "THUTO_RESULT_SAVED",
        "QUIZ_ATTEMPT_COMPLETED",
        "FLASHCARD_STUDY_COMPLETED",
        "STUDY_SESSION_COMPLETED",
        "THUTO_RECOMMENDATION_SCHEDULED",
        "KNOWLEDGE_COLLECTION_STUDIED"
    ]) {
        assert.match(combined, new RegExp(`ANALYTICS_EVENTS\\.${event}`));
    }

    assert.doesNotMatch(
        combined,
        /track\([^)]*\b(email|filename|message|query|text|title|content)\s*:/i
    );
});
