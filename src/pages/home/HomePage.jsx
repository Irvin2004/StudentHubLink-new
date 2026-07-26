import { Link } from "react-router-dom";

import { BrandLink } from "../../components/common/BrandLink.jsx";
import { ROUTES } from "../../config/routes.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useTheme } from "../../hooks/useTheme.js";

const FEATURES = [
    {
        title: "Study Resources",
        description:
            "Access approved notes, guides, images, and resource packs."
    },
    {
        title: "Upload & Earn",
        description:
            "Share useful academic material and keep 80% of every sale."
    },
    {
        title: "Student Communities",
        description:
            "Connect with classmates through focused groups and conversations."
    }
];

export default function HomePage() {
    useDocumentTitle("StudentHub | Learn Smarter", "landing");

    const { setTheme, theme } = useTheme();
    const nextTheme = theme === "dark" ? "light" : "dark";

    return (
        <>
            <header className="site-header">
                <nav className="nav" aria-label="Primary navigation">
                    <BrandLink />
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#marketplace">Marketplace</a>
                        <Link to={ROUTES.LOGIN}>Login</Link>
                        <Link className="btn btn-primary" to={ROUTES.REGISTER}>
                            Get Started
                        </Link>
                        <button
                            className="theme-toggle"
                            type="button"
                            aria-label={`Switch to ${nextTheme} mode`}
                            onClick={() => setTheme(nextTheme)}
                        >
                            {nextTheme === "dark" ? "Dark" : "Light"}
                        </button>
                    </div>
                </nav>
            </header>
            <main>
                <section className="hero">
                    <div className="hero-left">
                        <h1>
                            Learn smarter. Share knowledge. Build your future.
                        </h1>
                        <p>
                            StudentHub brings trusted resources, student
                            communities, and academic collaboration into one
                            accessible platform.
                        </p>
                        <div className="hero-actions">
                            <Link
                                className="btn btn-primary"
                                to={ROUTES.REGISTER}
                            >
                                Start Free
                            </Link>
                            <a className="btn btn-outline" href="#features">
                                Explore Platform
                            </a>
                        </div>
                    </div>
                    <div className="hero-right" aria-label="StudentHub preview">
                        <div className="dashboard-mockup">
                            <aside>
                                <h3>StudentHub</h3>
                                <p className="active">Dashboard</p>
                                <p>Resources</p>
                                <p>Communities</p>
                                <p>Messages</p>
                            </aside>
                            <div className="mock-content">
                                <div className="mock-top">
                                    <div>
                                        <h3>Welcome back</h3>
                                        <p>Your learning activity this week</p>
                                    </div>
                                    <span className="status">Online</span>
                                </div>
                                <div className="mock-stats">
                                    <article>
                                        <span>Resources</span>
                                        <strong>128</strong>
                                    </article>
                                    <article>
                                        <span>Communities</span>
                                        <strong>12</strong>
                                    </article>
                                    <article>
                                        <span>Messages</span>
                                        <strong>42</strong>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="features-section" id="features">
                    <div className="section-heading">
                        <h2>Everything students need in one place</h2>
                        <p>
                            A focused toolkit for learning, sharing, and working
                            together.
                        </p>
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((feature) => (
                            <article
                                className="feature-card"
                                key={feature.title}
                            >
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </section>
                <section className="marketplace-section" id="marketplace">
                    <div>
                        <h2>Turn knowledge into opportunity.</h2>
                        <p>
                            Upload quality notes, set a fair price, and earn
                            whenever another student purchases your work.
                        </p>
                    </div>
                    <Link className="btn btn-primary" to={ROUTES.REGISTER}>
                        Create an account
                    </Link>
                </section>
            </main>
            <footer>
                <p>© 2026 StudentHub. Built to empower students.</p>
            </footer>
        </>
    );
}
