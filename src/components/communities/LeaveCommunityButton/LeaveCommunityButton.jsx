import { useState } from "react";

import Button from "../../ui/Button/index.js";
import { useCommunities } from "../../../hooks/useCommunities.js";

export default function LeaveCommunityButton({
    communityId,
    communityName,
    onError,
    onLeft
}) {
    const { leaveCommunity } = useCommunities({ enabled: false });
    const [loading, setLoading] = useState(false);

    async function handleLeave() {
        setLoading(true);

        try {
            await leaveCommunity(communityId);
            onLeft?.();
        } catch (error) {
            onError?.(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            aria-label={`Leave ${communityName}`}
            loading={loading}
            loadingLabel="Leaving"
            onClick={handleLeave}
            variant="danger"
        >
            Leave
        </Button>
    );
}
