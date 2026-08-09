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
import { LEGACY_ROUTES, ROUTES } from "../../config/routes.js";

export default function DashboardPage() {
    const { dashboard, error, loading, reload } = useDashboard();
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const welcomeUser = profile || user;
    const handleAIPlaceholder = (action) => {
        console.info(`AI assistant action selected: ${action}`);
    };

    const quickActions = [
        {
            label: "Upload Resource",
            icon: "⬆️",
            onClick: () => navigate(LEGACY_ROUTES.UPLOAD)
        },
        {
            label: "Join Community",
            icon: "👥",
            onClick: () => navigate(ROUTES.COMMUNITIES)
        },
        {
            label: "Browse Resources",
            icon: "📚",
            onClick: () => navigate(LEGACY_ROUTES.RESOURCES)
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
            onClick: () => handleAIPlaceholder("Summarise Notes")
        },
        {
            label: "Generate Flashcards",
            icon: "🃏",
            onClick: () => handleAIPlaceholder("Generate Flashcards")
        },
        {
            label: "Create Quiz",
            icon: "✅",
            onClick: () => handleAIPlaceholder("Create Quiz")
        },
        {
            label: "Explain a Topic",
            icon: "💡",
            onClick: () => handleAIPlaceholder("Explain a Topic")
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
                onBrowseResources={() => navigate(LEGACY_ROUTES.RESOURCES)}
                onContinue={() => navigate(ROUTES.FILES)}
                onRetry={reload}
                task={dashboard.focusTask}
            />

            <div className={styles.focus}>
                <StudyStreak
                    onStart={() => navigate(LEGACY_ROUTES.RESOURCES)}
                    loading={loading}
                    streak={dashboard.studyStreak}
                />
            </div>

            <div className={styles.contentGrid}>
                <ContinueLearning
                    error={error}
                    onBrowseResources={() => navigate(LEGACY_ROUTES.RESOURCES)}
                    onOpenResource={() => navigate(ROUTES.FILES)}
                    loading={loading}
                    onRetry={reload}
                    resources={dashboard.continueLearning}
                />
                <UpcomingDeadlines
                    onBrowseResources={() => navigate(LEGACY_ROUTES.RESOURCES)}
                    onOpenAssignment={() => navigate(ROUTES.FILES)}
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
                    onAskAI={() => handleAIPlaceholder("Ask AI")}
                    onRetry={reload}
                />
            </div>
        </main>
    );
}
