import { FeaturePlaceholder } from "../../components/common/FeaturePlaceholder.jsx";
import { LEGACY_ROUTES } from "../../config/routes.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

export default function FilesPage() {
    useDocumentTitle("StudentHub - Files", "react-app");

    return (
        <FeaturePlaceholder
            title="Files"
            description="Find shared notes, assignments, and study resources."
            legacyHref={LEGACY_ROUTES.RESOURCES}
        />
    );
}
