import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingScreen } from "../components/feedback/LoadingScreen.jsx";
import { ROUTES } from "../config/routes.js";
import { useAuth } from "../hooks/useAuth.js";

export function ProtectedRoute() {
    const { loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen label="Checking your session…" />;
    }

    return user ? (
        <Outlet />
    ) : (
        <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
    );
}
