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
    const [channelState, setChannelState] = useState({
        key: "",
        value: []
    });
    const [loadedCommunityId, setLoadedCommunityId] = useState("");
    const [errorState, setErrorState] = useState({
        key: "",
        value: null
    });
    const channels = channelState.key === communityId ? channelState.value : [];
    const error = errorState.key === communityId ? errorState.value : null;
    const loading = Boolean(
        communityId && loadedCommunityId !== communityId && !error
    );

    useEffect(() => {
        if (!communityId) return undefined;

        return subscribeToChannels(
            communityId,
            (nextChannels) => {
                setChannelState({ key: communityId, value: nextChannels });
                setLoadedCommunityId(communityId);
                setErrorState({ key: communityId, value: null });
            },
            (nextError) => {
                setLoadedCommunityId(communityId);
                setErrorState({ key: communityId, value: nextError });
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
