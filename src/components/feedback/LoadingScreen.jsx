export function LoadingScreen({ label = "Loading StudentHub…" }) {
    return (
        <main className="loading-screen" aria-busy="true" aria-live="polite">
            <span className="loading-screen__mark" aria-hidden="true">
                S
            </span>
            <p>{label}</p>
        </main>
    );
}
