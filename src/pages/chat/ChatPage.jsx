import { FeaturePlaceholder } from "../../components/common/FeaturePlaceholder.jsx";
import { LEGACY_ROUTES } from "../../config/routes.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

export default function ChatPage() {
    useDocumentTitle("StudentHub - Chat", "react-app");

    return (
        <FeaturePlaceholder
            title="Chat"
            description="Keep conversations and academic collaboration moving."
            legacyHref={LEGACY_ROUTES.MESSAGES}
        />
    );
}
