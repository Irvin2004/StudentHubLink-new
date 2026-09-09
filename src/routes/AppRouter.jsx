import { lazy, Suspense } from "react";
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useParams
} from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout/AppLayout.jsx";
import { LoadingScreen } from "../components/feedback/LoadingScreen.jsx";
import PerformanceProfiler from "../components/performance/PerformanceProfiler.jsx";
import { LEGACY_APP_REDIRECTS, ROUTES } from "../config/routes.js";
import { GuestRoute } from "./GuestRoute.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";

const HomePage = lazy(() => import("../pages/home/HomePage.jsx"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage.jsx"));
const DashboardPage = lazy(
    () => import("../features/dashboard/DashboardPage.jsx")
);
const DiscoverPage = lazy(
    () => import("../features/discovery/DiscoverPage.jsx")
);
const CommunitiesPage = lazy(
    () => import("../pages/communities/CommunitiesPage.jsx")
);
const CommunityPage = lazy(
    () => import("../pages/community/CommunityPage.jsx")
);
const ChatPage = lazy(() => import("../pages/chat/ChatPage.jsx"));
const FriendsPage = lazy(() => import("../features/friends/FriendsPage.jsx"));
const ResourceLibraryPage = lazy(
    () => import("../features/resourceLibrary/ResourceLibraryPage.jsx")
);
const StudyPlannerPage = lazy(
    () => import("../features/studyPlanner/StudyPlannerPage.jsx")
);
const FlashcardsPage = lazy(
    () => import("../features/flashcards/FlashcardsPage.jsx")
);
const QuizPage = lazy(() => import("../features/quizzes/QuizPage.jsx"));
const NotificationsPage = lazy(
    () => import("../pages/notifications/NotificationsPage.jsx")
);
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

function ProfiledRoute({ children, id }) {
    return <PerformanceProfiler id={id}>{children}</PerformanceProfiler>;
}

function CanonicalRedirect({ to }) {
    const { search } = useLocation();

    return <Navigate replace to={{ pathname: to, search }} />;
}

function CommunityRedirect() {
    const { communityId } = useParams();
    const { search } = useLocation();

    return (
        <Navigate
            replace
            to={{
                pathname: `/community/${communityId}/channel/general`,
                search
            }}
        />
    );
}

export function AppRouter() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route element={<GuestRoute />}>
                    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                    <Route
                        path="/login.html"
                        element={<CanonicalRedirect to={ROUTES.LOGIN} />}
                    />
                    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    <Route
                        path="/register.html"
                        element={<CanonicalRedirect to={ROUTES.REGISTER} />}
                    />
                </Route>
                <Route element={<ProtectedRoute />}>
                    {LEGACY_APP_REDIRECTS.map(({ from, to }) => (
                        <Route
                            key={from}
                            path={from}
                            element={<CanonicalRedirect to={to} />}
                        />
                    ))}
                    <Route element={<AppLayout />}>
                        <Route
                            path={ROUTES.DASHBOARD}
                            element={
                                <ProfiledRoute id="DashboardPage">
                                    <DashboardPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.COMMUNITIES}
                            element={
                                <ProfiledRoute id="CommunitiesPage">
                                    <CommunitiesPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.DISCOVER}
                            element={
                                <ProfiledRoute id="DiscoverPage">
                                    <DiscoverPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.COMMUNITY}
                            element={<CommunityRedirect />}
                        />
                        <Route
                            path={ROUTES.COMMUNITY_CHANNEL}
                            element={
                                <ProfiledRoute id="CommunityPage">
                                    <CommunityPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.COMMUNITY_QUESTIONS}
                            element={
                                <ProfiledRoute id="CommunityQuestionsPage">
                                    <CommunityPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.COMMUNITY_COLLECTIONS}
                            element={
                                <ProfiledRoute id="CommunityKnowledgeCollectionsPage">
                                    <CommunityPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CHAT}
                            element={
                                <ProfiledRoute id="ChatPage">
                                    <ChatPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.FRIENDS}
                            element={
                                <ProfiledRoute id="FriendsPage">
                                    <FriendsPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.RESOURCES}
                            element={
                                <ProfiledRoute id="ResourceLibraryPage">
                                    <ResourceLibraryPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.RESOURCES_SHORT}
                            element={
                                <CanonicalRedirect to={ROUTES.RESOURCES} />
                            }
                        />
                        <Route
                            path={ROUTES.FILES}
                            element={
                                <CanonicalRedirect to={ROUTES.RESOURCES} />
                            }
                        />
                        <Route
                            path={ROUTES.STUDY_PLANNER}
                            element={
                                <ProfiledRoute id="StudyPlannerPage">
                                    <StudyPlannerPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.FLASHCARDS}
                            element={
                                <ProfiledRoute id="FlashcardsPage">
                                    <FlashcardsPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.QUIZZES}
                            element={
                                <ProfiledRoute id="QuizPage">
                                    <QuizPage />
                                </ProfiledRoute>
                            }
                        />
                        <Route
                            path={ROUTES.NOTIFICATIONS}
                            element={<NotificationsPage />}
                        />
                        <Route
                            path={ROUTES.SETTINGS}
                            element={<SettingsPage />}
                        />
                    </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}
