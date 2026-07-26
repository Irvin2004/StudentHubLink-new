import styles from "./ErrorBoundary.module.css";

export default function ErrorFallback({
    homeUrl = "/",
    onReload = () => window.location.reload()
}) {
    return (
        <main className={styles.page}>
            <section
                aria-labelledby="error-boundary-title"
                className={styles.card}
            >
                <span aria-hidden="true" className={styles.icon}>
                    !
                </span>
                <div className={styles.copy}>
                    <h1 id="error-boundary-title">Something went wrong</h1>
                    <p>StudentHub encountered an unexpected error.</p>
                    <p>
                        Your work was not intentionally changed. Reload the
                        page, or return home and try again.
                    </p>
                </div>
                <div className={styles.actions}>
                    <button
                        className={styles.primaryAction}
                        onClick={onReload}
                        type="button"
                    >
                        Reload Page
                    </button>
                    <a className={styles.secondaryAction} href={homeUrl}>
                        Go Home
                    </a>
                </div>
            </section>
        </main>
    );
}
