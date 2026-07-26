import { Navigate, Outlet } from "react-router-dom";

import { LoadingScreen } from "../components/feedback/LoadingScreen.jsx";
import { ROUTES } from "../config/routes.js";
import { useAuth } from "../hooks/useAuth.js";

export function GuestRoute() {
    const { loading, user } = useAuth();

    if (loading) {
        return <LoadingScreen label="Loading your session…" />;
    }

    return user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />;
}
