import { useState } from "react";

import Button from "../../ui/Button/index.js";
import { useCommunities } from "../../../hooks/useCommunities.js";

export default function JoinCommunityButton({
    communityId,
    communityName,
    onError,
    onJoined
}) {
    const { joinCommunity } = useCommunities({ enabled: false });
    const [loading, setLoading] = useState(false);

    async function handleJoin() {
        setLoading(true);

        try {
            const membership = await joinCommunity(communityId);
            onJoined?.(membership);
        } catch (error) {
            onError?.(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            aria-label={`Join ${communityName}`}
            loading={loading}
            loadingLabel="Joining"
            onClick={handleJoin}
            variant="outline"
        >
            Join
        </Button>
    );
}
