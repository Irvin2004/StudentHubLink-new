import { useEffect, useState } from "react";

import { listenToActivity } from "../services/activity-service.js";

export function useActivityFeed(communityId, { enabled = true } = {}) {
    const [activities, setActivities] = useState([]);
    const shouldSubscribe = Boolean(enabled && communityId);
    const [loadedCommunityId, setLoadedCommunityId] = useState("");
    const [errorState, setErrorState] = useState({
        key: "",
        value: null
    });
    const subscriptionKey = shouldSubscribe ? communityId : "";
    const error = errorState.key === subscriptionKey ? errorState.value : null;
    const loading = Boolean(
        shouldSubscribe && loadedCommunityId !== subscriptionKey && !error
    );

    useEffect(() => {
        if (!shouldSubscribe) return undefined;

        return listenToActivity(
            communityId,
            (next) => {
                setActivities(next);
                setLoadedCommunityId(subscriptionKey);
                setErrorState({ key: subscriptionKey, value: null });
            },
            (nextError) => {
                setLoadedCommunityId(subscriptionKey);
                setErrorState({ key: subscriptionKey, value: nextError });
            }
        );
    }, [communityId, shouldSubscribe, subscriptionKey]);

    return { activities, error, loading };
}
