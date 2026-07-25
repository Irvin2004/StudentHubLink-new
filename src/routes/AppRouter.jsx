import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout/AppLayout.jsx";
import { LoadingScreen } from "../components/feedback/LoadingScreen.jsx";
import { ROUTES } from "../config/routes.js";
import { GuestRoute } from "./GuestRoute.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";

const HomePage = lazy(() => import("../pages/home/HomePage.jsx"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage.jsx"));
const DashboardPage = lazy(
    () => import("../pages/dashboard/DashboardPage.jsx")
);
const CommunitiesPage = lazy(
    () => import("../pages/communities/CommunitiesPage.jsx")
);
const CommunityPage = lazy(
    () => import("../pages/community/CommunityPage.jsx")
);
const ChatPage = lazy(() => import("../pages/chat/ChatPage.jsx"));
const FilesPage = lazy(() => import("../pages/files/FilesPage.jsx"));
const NotificationsPage = lazy(
    () => import("../pages/notifications/NotificationsPage.jsx")
);
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

export function AppRouter() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route element={<GuestRoute />}>
                    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                    <Route path="/login.html" element={<LoginPage />} />
                    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    <Route path="/register.html" element={<RegisterPage />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route
                            path={ROUTES.DASHBOARD}
                            element={<DashboardPage />}
                        />
                        <Route
                            path={ROUTES.COMMUNITIES}
                            element={<CommunitiesPage />}
                        />
                        <Route
                            path={ROUTES.COMMUNITY}
                            element={<CommunityPage />}
                        />
                        <Route
                            path={ROUTES.COMMUNITY_CHANNEL}
                            element={<CommunityPage />}
                        />
                        <Route path={ROUTES.CHAT} element={<ChatPage />} />
                        <Route path={ROUTES.FILES} element={<FilesPage />} />
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
