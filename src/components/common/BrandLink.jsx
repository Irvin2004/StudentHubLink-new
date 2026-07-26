import { Link } from "react-router-dom";

import { ROUTES } from "../../config/routes.js";

export function BrandLink({ className = "logo" }) {
    return (
        <Link
            className={className}
            to={ROUTES.HOME}
            aria-label="StudentHub home"
        >
            <span className="brand-mark" aria-hidden="true">
                S
            </span>
            StudentHub
        </Link>
    );
}
