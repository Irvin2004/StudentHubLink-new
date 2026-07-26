import { Component } from "react";

import { useObservability } from "../../hooks/useObservability.js";
import styles from "./AppErrorBoundary.module.css";

class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        this.props.onError(error, {
            component: "AppErrorBoundary",
            componentStack: Boolean(info?.componentStack),
            recoverable: false
        });
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <main className={styles.page}>
                <span aria-hidden="true">!</span>
                <h1>StudentHub hit an unexpected problem</h1>
                <p>
                    Your work was not intentionally changed. Reload the page to
                    reconnect, or return to the dashboard.
                </p>
                <div>
                    <button
                        onClick={() => window.location.reload()}
                        type="button"
                    >
                        Reload page
                    </button>
                    <a href="/app">Return to dashboard</a>
                </div>
            </main>
        );
    }
}

export default function AppErrorBoundary({ children }) {
    const { captureError } = useObservability();
    return <ErrorBoundary onError={captureError}>{children}</ErrorBoundary>;
}
