import { Link } from "react-router-dom";

import { ROUTES } from "../config/routes.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function NotFoundPage() {
    useDocumentTitle("Page not found - StudentHub", "not-found");

    return (
        <main className="react-not-found">
            <span aria-hidden="true">404</span>
            <h1>That page is not available.</h1>
            <p>Check the address or return to the StudentHub home page.</p>
            <Link className="btn btn-primary" to={ROUTES.HOME}>
                Go home
            </Link>
        </main>
    );
}
