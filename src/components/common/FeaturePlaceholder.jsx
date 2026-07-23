export function FeaturePlaceholder({ title, description, legacyHref }) {
    return (
        <main className="react-page">
            <header className="react-page__heading">
                <div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            </header>
            <section className="react-empty-panel">
                <h2>React migration in progress</h2>
                <p>
                    This route is established and protected. Its existing
                    StudentHub implementation remains available during the
                    incremental migration.
                </p>
                {legacyHref ? (
                    <a className="btn btn-primary" href={legacyHref}>
                        Open current experience
                    </a>
                ) : null}
            </section>
        </main>
    );
}
