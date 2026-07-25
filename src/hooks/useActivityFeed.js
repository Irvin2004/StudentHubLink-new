import { useEffect, useState } from "react";

import { listenToActivity } from "../services/activity-service.js";

export function useActivityFeed(communityId) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(Boolean(communityId));
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!communityId) return undefined;
        return listenToActivity(
            communityId,
            (next) => {
                setActivities(next);
                setLoading(false);
            },
            (nextError) => {
                setError(nextError);
                setLoading(false);
            }
        );
    }, [communityId]);
    return { activities, error, loading };
}
