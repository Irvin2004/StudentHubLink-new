import { FeaturePlaceholder } from "../../components/common/FeaturePlaceholder.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

export default function CommunitiesPage() {
    useDocumentTitle("StudentHub - Communities", "react-app");

    return (
        <FeaturePlaceholder
            title="Communities"
            description="Find focused spaces for courses, projects, and study groups."
            legacyHref="/pages/groups.html"
        />
    );
}
