import { useState } from "react";

import Button from "../../ui/Button/index.js";

export default function LeaveCommunityButton({
    communityName,
    onError,
    onLeave,
    onLeft
}) {
    const [loading, setLoading] = useState(false);

    async function handleLeave() {
        setLoading(true);

        try {
            await onLeave();
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
