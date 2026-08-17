import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import { AIAssistantCard } from "./components/AIAssistantCard/index.js";
import { ContinueLearning } from "./components/ContinueLearning/ContinueLearning.jsx";
import { FocusCard } from "./components/FocusCard/FocusCard.jsx";
import { QuickActions } from "./components/QuickActions/index.js";
import { RecentActivity } from "./components/RecentActivity/index.js";
import { StatsGrid } from "./components/StatsGrid/StatsGrid.jsx";
import { StudyStreak } from "./components/StudyStreak/StudyStreak.jsx";
import { UpcomingDeadlines } from "./components/UpcomingDeadlines/UpcomingDeadlines.jsx";
import { WelcomeCard } from "./components/WelcomeCard/WelcomeCard.jsx";
import { useDashboard } from "./hooks/useDashboard.js";
import { ROUTES } from "../../config/routes.js";
import { useStudySession } from "../studySessions/context/study-session-context.js";
import AIAssistantDialog from "../aiAssistant/components/AIAssistantDialog.jsx";
import { AI_ACTIONS } from "../aiAssistant/config/ai-action-types.js";
import { useAIAssistant } from "../aiAssistant/hooks/useAIAssistant.js";

function getStudyPlannerRoute(taskId) {
    if (!taskId) return ROUTES.STUDY_PLANNER;

    return `${ROUTES.STUDY_PLANNER}?task=${encodeURIComponent(taskId)}`;
}

function getResourceRoute(resourceId) {
    if (!resourceId) return ROUTES.RESOURCES;

    return `${ROUTES.RESOURCES}?resource=${encodeURIComponent(resourceId)}`;
}

function getFlashcardRoute(deckId, mode) {
    if (!deckId) return ROUTES.FLASHCARDS;
    const modeQuery = mode ? `&mode=${encodeURIComponent(mode)}` : "";
    return `${ROUTES.FLASHCARDS}?deck=${encodeURIComponent(deckId)}${modeQuery}`;
}

function getQuizRoute(quizId, mode = "take") {
    if (!quizId) return ROUTES.QUIZZES;
    const modeQuery = mode ? `&mode=${encodeURIComponent(mode)}` : "";
    return `${ROUTES.QUIZZES}?quiz=${encodeURIComponent(quizId)}${modeQuery}`;
}

function getContinueLearningRoute(item) {
    if (item?.learningType === "quiz") {
        return getQuizRoute(item.quizId || item.id);
    }
    if (item?.learningType === "flashcard" || item?.deckId) {
        return getFlashcardRoute(item.deckId || item.id);
    }
    if (item?.learningType === "resource" || item?.resourceKey) {
        return getResourceRoute(item.resourceKey || item.id);
    }
    return ROUTES.RESOURCES;
}

export default function DashboardPage() {
    const { startSession } = useStudySession();
    const { dashboard, error, loading, reload } = useDashboard();
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const aiAssistant = useAIAssistant(user?.uid);
    const welcomeUser = profile || user;
    const startTaskSession = (task) =>
        startSession({
            sourceType: "task",
            subject: task.subject,
            taskId: task.id,
            title: task.title
        });
    const startResourceSession = (resource) =>
        startSession({
            resourceId: resource.resourceKey || resource.id,
            sourceType: "resource",
            subject: resource.subject,
            title: resource.title
        });
    const quickActions = [
        {
            label: "Upload Resource",
            icon: "⬆️",
            onClick: () => navigate(`${ROUTES.RESOURCES}?action=upload`)
        },
        {
            label: "Join Community",
            icon: "👥",
            onClick: () => navigate(ROUTES.COMMUNITIES)
        },
        {
            label: "Browse Resources",
            icon: "📚",
            onClick: () => navigate(ROUTES.RESOURCES)
        },
        {
            label: "Messages",
            icon: "💬",
            onClick: () => navigate(ROUTES.CHAT)
        }
    ];
    const aiActions = [
        {
            label: "Summarise Notes",
            icon: "📝",
            onClick: () => aiAssistant.openAssistant(AI_ACTIONS.SUMMARISE_NOTES)
        },
        {
            label: "Generate Flashcards",
            icon: "🃏",
            onClick: () =>
                aiAssistant.openAssistant(AI_ACTIONS.GENERATE_FLASHCARDS)
        },
        {
            label: "Create Quiz",
            icon: "✅",
            onClick: () => aiAssistant.openAssistant(AI_ACTIONS.GENERATE_QUIZ)
        },
        {
            label: "Explain a Topic",
            icon: "💡",
            onClick: () => aiAssistant.openAssistant(AI_ACTIONS.EXPLAIN_TOPIC)
        },
        {
            label: "Suggest Study Plan",
            icon: "🗓️",
            onClick: () => aiAssistant.openAssistant(AI_ACTIONS.STUDY_PLAN)
        }
    ];

    useDocumentTitle("StudentHub - Dashboard", "dashboard");

    return (
        <main className={styles.page}>
            <WelcomeCard
                error={error}
                greeting={dashboard.greeting}
                loading={loading}
                onCompleteProfile={() => navigate(ROUTES.SETTINGS)}
                onContinueLearning={() =>
                    navigate(
                        getContinueLearningRoute(
                            dashboard.continueLearning?.[0]
                        )
                    )
                }
                studyStreak={dashboard.studyStreak?.current ?? 0}
                user={welcomeUser}
                onRetry={reload}
            />

            <div className={styles.stats}>
                <StatsGrid
                    error={error}
                    loading={loading}
                    onRetry={reload}
                    stats={dashboard.stats}
                />
            </div>

            <FocusCard
                error={error}
                loading={loading}
                onBrowseResources={() => navigate(ROUTES.STUDY_PLANNER)}
                onContinue={(taskId) => navigate(getStudyPlannerRoute(taskId))}
                onReviewFlashcards={(deckId) =>
                    navigate(getFlashcardRoute(deckId, "due"))
                }
                onStartSession={() => startTaskSession(dashboard.focusTask)}
                onTakeQuiz={(quizId, taskId) =>
                    navigate(
                        `${getQuizRoute(quizId)}&task=${encodeURIComponent(taskId)}`
                    )
                }
                onRetry={reload}
                task={dashboard.focusTask}
                weeklyGoalMinutes={dashboard.weeklyGoalMinutes}
                weeklyMinutes={dashboard.weeklyMinutes}
                weeklyProgress={dashboard.weeklyProgress}
            />

            <div className={styles.focus}>
                <StudyStreak
                    onStart={() =>
                        dashboard.focusTask
                            ? startTaskSession(dashboard.focusTask)
                            : navigate(ROUTES.RESOURCES)
                    }
                    loading={loading}
                    streak={dashboard.studyStreak}
                />
            </div>

            <div className={styles.contentGrid}>
                <ContinueLearning
                    error={error}
                    onBrowseResources={() => navigate(ROUTES.RESOURCES)}
                    onOpenResource={(resourceId) =>
                        navigate(getResourceRoute(resourceId))
                    }
                    onOpenFlashcards={(deckId) =>
                        navigate(getFlashcardRoute(deckId))
                    }
                    onOpenQuiz={(quizId) => navigate(getQuizRoute(quizId))}
                    onReviewFlashcards={(deckId) =>
                        navigate(getFlashcardRoute(deckId, "due"))
                    }
                    onStartSession={startResourceSession}
                    loading={loading}
                    onRetry={reload}
                    resources={dashboard.continueLearning}
                />
                <UpcomingDeadlines
                    onBrowseResources={() => navigate(ROUTES.STUDY_PLANNER)}
                    onOpenAssignment={(taskId) =>
                        navigate(getStudyPlannerRoute(taskId))
                    }
                    deadlines={dashboard.deadlines}
                    error={error}
                    loading={loading}
                    onRetry={reload}
                />
                <RecentActivity
                    activities={dashboard.activity}
                    error={error}
                    loading={loading}
                    onRetry={reload}
                />
                <QuickActions
                    actions={quickActions}
                    error={error}
                    loading={loading}
                    onRetry={reload}
                />
            </div>

            <div className={styles.assistant}>
                <AIAssistantCard
                    actions={aiActions}
                    error={error}
                    loading={loading}
                    onAskAI={() => aiAssistant.openAssistant()}
                    onRetry={reload}
                />
            </div>

            <AIAssistantDialog
                action={aiAssistant.action}
                error={aiAssistant.error}
                key={`${aiAssistant.action}-${aiAssistant.open}`}
                loading={aiAssistant.loading}
                onClose={aiAssistant.closeAssistant}
                onRetry={aiAssistant.retry}
                onRun={aiAssistant.run}
                onSave={aiAssistant.save}
                open={aiAssistant.open}
                result={aiAssistant.result}
                saveError={aiAssistant.saveError}
                saved={aiAssistant.saved}
                saving={aiAssistant.saving}
            />
        </main>
    );
}
