import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { FormField } from "../../components/forms/FormField.jsx";
import { ROUTES } from "../../config/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { mapAuthError } from "../../utils/auth-error-mapper.js";
import { AuthLayout } from "./AuthLayout.jsx";

const REGISTER_FEATURES = [
    "Upload PDFs, images, Office files, and ZIP resource packs",
    "Earn 80% from paid resource sales",
    "Access approved study materials anytime"
];

export default function RegisterPage() {
    useDocumentTitle("StudentHub - Register", "register");

    const { register } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setMessage("");

        const form = new FormData(event.currentTarget);

        try {
            await register({
                fullName: form.get("fullName"),
                email: form.get("email"),
                password: form.get("password")
            });
            navigate(ROUTES.DASHBOARD, { replace: true });
        } catch (error) {
            setMessage(mapAuthError(error));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout
            title="Start learning smarter today."
            description="Create your StudentHub account to access trusted resources, upload your own notes, and earn from your knowledge."
            features={REGISTER_FEATURES}
        >
            <form className="auth-card" onSubmit={handleSubmit}>
                <h2>Create Account</h2>
                <p className="subtitle">
                    Join StudentHub and start your learning journey.
                </p>
                <FormField
                    autoComplete="name"
                    id="fullName"
                    label="Full Name"
                    placeholder="Enter your full name"
                    required
                    type="text"
                />
                <FormField
                    autoComplete="email"
                    id="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    required
                    type="email"
                />
                <FormField
                    autoComplete="new-password"
                    helpText="Use at least eight characters."
                    id="password"
                    label="Password"
                    minLength={8}
                    placeholder="Create a password"
                    required
                    type="password"
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? "Creating account…" : "Create Account"}
                </button>
                <p className="form-message error" role="alert">
                    {message}
                </p>
                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to={ROUTES.LOGIN}>Login</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
