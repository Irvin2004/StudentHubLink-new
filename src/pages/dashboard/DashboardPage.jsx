import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

export default function DashboardPage() {
    useDocumentTitle("StudentHub - Home", "react-app");

    return (
        <main className="react-page">
            <header className="react-page__heading">
                <div>
                    <h1>Home</h1>
                    <p>Your StudentHub workspace.</p>
                </div>
            </header>
        </main>
    );
}
