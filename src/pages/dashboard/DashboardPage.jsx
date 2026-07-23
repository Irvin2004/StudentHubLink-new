import { Link } from "react-router-dom";

import { LEGACY_ROUTES, ROUTES } from "../../config/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

const actions = [
    {
        title: "Join a community",
        description: "Find classmates and study groups.",
        to: ROUTES.COMMUNITIES
    },
    {
        title: "Open chat",
        description: "Continue your conversations.",
        to: ROUTES.CHAT
    },
    {
        title: "Browse resources",
        description: "Explore approved academic material.",
        href: LEGACY_ROUTES.RESOURCES
    }
];

export default function DashboardPage() {
    useDocumentTitle("StudentHub - Dashboard", "react-dashboard");

    const { profile, user } = useAuth();
    const name = profile?.displayName || user?.displayName || "Student";

    return (
        <main className="react-page">
            <header className="react-page__heading">
                <div>
                    <h1>Welcome, {name}</h1>
                    <p>Your StudentHub workspace is ready.</p>
                </div>
            </header>
            <section className="react-action-grid" aria-label="Quick actions">
                {actions.map((action) => (
                    <article key={action.title}>
                        <h2>{action.title}</h2>
                        <p>{action.description}</p>
                        {action.to ? (
                            <Link to={action.to}>Open</Link>
                        ) : (
                            <a href={action.href}>Open</a>
                        )}
                    </article>
                ))}
            </section>
        </main>
    );
}
