import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import styles from "./Dashboard.module.css";
import { AIAssistantCard } from "./components/AIAssistantCard/AIAssistantCard.jsx";
import { ContinueLearning } from "./components/ContinueLearning/ContinueLearning.jsx";
import { QuickActions } from "./components/QuickActions/QuickActions.jsx";
import { RecentActivity } from "./components/RecentActivity/RecentActivity.jsx";
import { StatsGrid } from "./components/StatsGrid/StatsGrid.jsx";
import { UpcomingDeadlines } from "./components/UpcomingDeadlines/UpcomingDeadlines.jsx";
import { WelcomeCard } from "./components/WelcomeCard/WelcomeCard.jsx";
import { useDashboard } from "./hooks/useDashboard.js";

export default function DashboardPage() {
    const { dashboard, error, loading, reload } = useDashboard();

    useDocumentTitle("StudentHub - Dashboard", "dashboard");

    return (
        <main className={styles.page}>
            <WelcomeCard
                error={error}
                greeting={dashboard.greeting}
                loading={loading}
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

            <div className={styles.contentGrid}>
                <ContinueLearning
                    error={error}
                    items={dashboard.continueLearning}
                    loading={loading}
                    onRetry={reload}
                />
                <UpcomingDeadlines
                    deadlines={dashboard.deadlines}
                    error={error}
                    loading={loading}
                    onRetry={reload}
                />
                <RecentActivity
                    activity={dashboard.activity}
                    error={error}
                    loading={loading}
                    onRetry={reload}
                />
                <QuickActions
                    actions={dashboard.quickActions}
                    error={error}
                    loading={loading}
                    onRetry={reload}
                />
            </div>

            <div className={styles.assistant}>
                <AIAssistantCard
                    error={error}
                    loading={loading}
                    onRetry={reload}
                    suggestions={dashboard.aiSuggestions}
                />
            </div>
        </main>
    );
}
