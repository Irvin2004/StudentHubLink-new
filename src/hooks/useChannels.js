import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./useAuth.js";
import {
    createChannel as createChannelRecord,
    deleteChannel as deleteChannelRecord,
    subscribeToChannels,
    updateChannel as updateChannelRecord
} from "../services/channel-service.js";

export function useChannels(communityId) {
    const { user } = useAuth();
    const userId = user?.uid ?? null;
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(Boolean(communityId));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!communityId) return undefined;

        return subscribeToChannels(
            communityId,
            (nextChannels) => {
                setChannels(nextChannels);
                setLoading(false);
            },
            (nextError) => {
                setError(nextError);
                setLoading(false);
            }
        );
    }, [communityId]);

    const createChannel = useCallback(
        (input) => createChannelRecord(communityId, input, userId),
        [communityId, userId]
    );
    const updateChannel = useCallback(
        (channelId, updates) =>
            updateChannelRecord(communityId, channelId, updates, userId),
        [communityId, userId]
    );
    const deleteChannel = useCallback(
        (channelId) => deleteChannelRecord(communityId, channelId, userId),
        [communityId, userId]
    );

    return {
        channels,
        loading,
        error,
        createChannel,
        updateChannel,
        deleteChannel
    };
}
