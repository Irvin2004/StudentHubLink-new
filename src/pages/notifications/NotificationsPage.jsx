import { FeaturePlaceholder } from "../../components/common/FeaturePlaceholder.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

export default function NotificationsPage() {
    useDocumentTitle("StudentHub - Notifications", "react-app");

    return (
        <FeaturePlaceholder
            title="Notifications"
            description="Review recent updates from your StudentHub activity."
        />
    );
}
