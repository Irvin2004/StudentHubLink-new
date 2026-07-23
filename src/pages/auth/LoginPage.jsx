import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { FormField } from "../../components/forms/FormField.jsx";
import { ROUTES } from "../../config/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../hooks/useToast.js";
import { AuthLayout } from "./AuthLayout.jsx";

const LOGIN_FEATURES = [
    "Admin-approved study resources",
    "Student marketplace with 80/20 earnings",
    "Document assistance for student needs"
];

export default function LoginPage() {
    useDocumentTitle("StudentHub - Login", "login");

    const { login, resetPassword } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const destination = location.state?.from?.pathname || ROUTES.DASHBOARD;

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setMessage("");

        const form = new FormData(event.currentTarget);

        try {
            await login(form.get("email"), form.get("password"));
            navigate(destination, { replace: true });
        } catch {
            setMessage(
                "We could not sign you in. Check your details and try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReset() {
        if (!email.trim()) {
            setMessage("Enter your email address before requesting a reset.");
            return;
        }

        try {
            await resetPassword(email);
            showToast({
                type: "success",
                title: "Reset email sent",
                message: "Check your inbox for password reset instructions."
            });
        } catch {
            setMessage("We could not send the reset email. Please try again.");
        }
    }

    return (
        <AuthLayout
            title="Welcome back to smarter learning."
            description="Access trusted resources, manage uploads, track earnings, and continue building your academic journey."
            features={LOGIN_FEATURES}
        >
            <form className="auth-card" onSubmit={handleSubmit}>
                <h2>Login</h2>
                <p className="subtitle">
                    Enter your details to access your dashboard.
                </p>
                <FormField
                    autoComplete="email"
                    id="email"
                    label="Email Address"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                />
                <FormField
                    autoComplete="current-password"
                    id="password"
                    label="Password"
                    placeholder="Enter your password"
                    required
                    type="password"
                />
                <button
                    type="button"
                    className="auth-link-button"
                    onClick={handleReset}
                >
                    Forgot password?
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? "Signing in…" : "Login"}
                </button>
                <p className="form-message error" aria-live="polite">
                    {message}
                </p>
                <p className="auth-switch">
                    Don&apos;t have an account?{" "}
                    <Link to={ROUTES.REGISTER}>Create one</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
