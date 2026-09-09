import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Thuto study plans require review before planner persistence", () => {
    const dialog = read(
        "src/features/aiAssistant/components/AIAssistantDialog.jsx"
    );
    const review = read(
        "src/features/aiAssistant/components/GeneratedStudyPlanReview.jsx"
    );
    assert.match(dialog, /Review study plan/);
    assert.match(dialog, /GeneratedStudyPlanReview/);
    assert.match(review, /Nothing is added until you confirm/);
    assert.match(review, /Add[\s\S]*Study[\s\S]*Planner/);
});

test("reviewed tasks are validated and saved with one planner batch", () => {
    const validation = read(
        "src/features/aiAssistant/utils/generated-study-plan.js"
    );
    const persistence = read(
        "src/features/aiAssistant/services/ai-assistant-persistence.js"
    );
    assert.match(validation, /validateGeneratedStudyPlan/);
    assert.match(validation, /Select at least one task/);
    assert.match(persistence, /addStudyTasks\(userId, result\.tasks\)/);
    assert.doesNotMatch(persistence, /addStudyTask\(/);
});

test("planner refresh uses the established dashboard event", () => {
    const persistence = read(
        "src/features/aiAssistant/services/ai-assistant-persistence.js"
    );
    const dashboard = read("src/features/dashboard/hooks/useDashboard.js");
    assert.match(persistence, /study-plan-updated/);
    assert.match(dashboard, /study-plan-updated/);
});

test("learning-memory concepts drive advisory planner recommendations", () => {
    const memory = read(
        "src/features/learningMemory/services/learning-memory-service.js"
    );
    const recommendations = read(
        "src/features/learningMemory/utils/memory-planner-recommendations.js"
    );
    const planner = read("src/features/studyPlanner/StudyPlannerPage.jsx");
    const weeklyPlan = read(
        "src/features/studyPlanner/utils/thuto-weekly-plan.js"
    );

    assert.match(memory, /conceptsReference\(userId, topic\.topic\)/);
    assert.match(recommendations, /conceptCandidates/);
    assert.match(recommendations, /suggestThutoStudySchedule/);
    assert.match(planner, /MemoryRecommendations/);
    assert.match(planner, /setAddTaskOpen\(true\)/);
    assert.match(weeklyPlan, /weakConcepts/);
});

test("quiz and study evidence refresh personalized Thuto guidance", () => {
    const quizzes = read("src/features/quizzes/hooks/useQuizzes.js");
    const sessions = read(
        "src/features/studySessions/context/StudySessionProvider.jsx"
    );
    const dashboard = read("src/features/dashboard/hooks/useDashboard.js");
    const recommendations = read(
        "src/features/dashboard/utils/thuto-recommendations.js"
    );
    const presentation = read(
        "src/features/dashboard/components/RecommendedByThuto/RecommendedByThuto.jsx"
    );

    assert.match(quizzes, /recordQuizLearningMemory/);
    assert.match(quizzes, /quiz-attempt-completed/);
    assert.match(sessions, /recordStudySessionLearningMemory/);
    assert.match(sessions, /study-session-completed/);
    assert.match(dashboard, /getLearningMemoryOverview/);
    assert.match(dashboard, /generateThutoRecommendations/);
    assert.match(recommendations, /conceptCandidates/);
    assert.match(recommendations, /suggestThutoStudySchedule/);
    assert.match(presentation, /Learning evidence:/);
    assert.match(presentation, /Add to Study Plan/);
});

test("generated learning material refreshes every dependent V2 surface", () => {
    const persistence = read(
        "src/features/aiAssistant/services/ai-assistant-persistence.js"
    );
    const quizzes = read("src/features/quizzes/hooks/useQuizzes.js");
    const dashboard = read("src/features/dashboard/hooks/useDashboard.js");
    const planner = read("src/features/studyPlanner/hooks/useStudyPlanner.js");

    assert.match(persistence, /quizzes-updated/);
    assert.match(quizzes, /addEventListener\("quizzes-updated"/);
    assert.match(dashboard, /addEventListener\("quizzes-updated"/);
    assert.match(planner, /"quizzes-updated"/);
    assert.match(planner, /"flashcards-updated"/);
    assert.match(planner, /"study-session-completed"/);
});

test("grouped Knowledge Collections retain item labels for learning memory", () => {
    const collections = read(
        "src/features/knowledgeCollections/services/collection-study-context.js"
    );
    const memory = read(
        "src/features/learningMemory/services/learning-memory-service.js"
    );

    assert.match(collections, /memoryLabels/);
    assert.match(collections, /group\.flatMap/);
    assert.match(memory, /resource\.memoryLabels/);
});
