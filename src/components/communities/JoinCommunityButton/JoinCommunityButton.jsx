import { useState } from "react";

import Button from "../../ui/Button/index.js";

export default function JoinCommunityButton({
    communityName,
    onError,
    onJoin,
    onJoined
}) {
    const [loading, setLoading] = useState(false);

    async function handleJoin() {
        setLoading(true);

        try {
            const membership = await onJoin();
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
