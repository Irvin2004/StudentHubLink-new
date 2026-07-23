import { NavLink, Outlet } from "react-router-dom";

import { LEGACY_ROUTES, ROUTES } from "../../config/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { BrandLink } from "../common/BrandLink.jsx";

const navigation = [
    { label: "Overview", to: ROUTES.DASHBOARD, end: true },
    { label: "Communities", to: ROUTES.COMMUNITIES },
    { label: "Chat", to: ROUTES.CHAT },
    { label: "Settings", to: ROUTES.SETTINGS }
];

export function AppShell() {
    const { logout, profile, user } = useAuth();
    const displayName = profile?.displayName || user?.displayName || "Student";

    return (
        <div className="react-app-shell">
            <aside className="react-sidebar">
                <BrandLink className="react-sidebar__brand" />
                <nav aria-label="Application navigation">
                    {navigation.map((item) => (
                        <NavLink
                            end={item.end}
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                isActive ? "active" : undefined
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <a href={LEGACY_ROUTES.RESOURCES}>Resources</a>
                    <a href={LEGACY_ROUTES.MESSAGES}>Legacy messages</a>
                </nav>
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={logout}
                >
                    Log out
                </button>
            </aside>
            <div className="react-app-main">
                <header className="react-app-header">
                    <div>
                        <span>Signed in as</span>
                        <strong>{displayName}</strong>
                    </div>
                </header>
                <Outlet />
            </div>
        </div>
    );
}
