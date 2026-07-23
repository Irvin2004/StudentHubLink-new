import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./useAuth.js";
import {
    createCommunity as createCommunityRecord,
    getCommunities,
    joinCommunity as joinCommunityRecord,
    leaveCommunity as leaveCommunityRecord
} from "../services/community-service.js";

/**
 * Loads communities and exposes authenticated community mutations.
 *
 * @param {{visibility?: string, category?: string, maxResults?: number}} [options]
 * @returns {{communities: object[], loading: boolean, error: Error|null, createCommunity: Function, joinCommunity: Function, leaveCommunity: Function, refreshCommunities: Function}}
 */
export function useCommunities(options = {}) {
    const { user } = useAuth();
    const userId = user?.uid ?? null;
    const enabled = options.enabled !== false;
    const visibility = options.visibility;
    const category = options.category;
    const maxResults = options.maxResults;
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);

    const refreshCommunities = useCallback(async () => {
        if (!enabled) return [];

        setLoading(true);
        setError(null);

        try {
            const nextCommunities = await getCommunities({
                visibility,
                category,
                maxResults
            });

            setCommunities(nextCommunities);
            return nextCommunities;
        } catch (nextError) {
            setError(nextError);
            throw nextError;
        } finally {
            setLoading(false);
        }
    }, [category, enabled, maxResults, visibility]);

    useEffect(() => {
        if (!enabled) return undefined;

        let active = true;

        void Promise.resolve()
            .then(() => {
                if (active) {
                    setLoading(true);
                    setError(null);
                }

                return getCommunities({ visibility, category, maxResults });
            })
            .then((nextCommunities) => {
                if (active) setCommunities(nextCommunities);
            })
            .catch((nextError) => {
                if (active) setError(nextError);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [category, enabled, maxResults, visibility]);

    const createCommunity = useCallback(
        async (input) => {
            if (!userId) {
                throw new Error("Authentication is required.");
            }

            const community = await createCommunityRecord(input, userId);

            setCommunities((current) => [community, ...current]);
            return community;
        },
        [userId]
    );

    const joinCommunity = useCallback(
        async (communityId, nickname = null) => {
            if (!userId) {
                throw new Error("Authentication is required.");
            }

            const membership = await joinCommunityRecord(
                communityId,
                userId,
                nickname
            );
            await refreshCommunities();
            return membership;
        },
        [refreshCommunities, userId]
    );

    const leaveCommunity = useCallback(
        async (communityId) => {
            if (!userId) {
                throw new Error("Authentication is required.");
            }

            await leaveCommunityRecord(communityId, userId);
            await refreshCommunities();
        },
        [refreshCommunities, userId]
    );

    return {
        communities,
        loading,
        error,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        refreshCommunities
    };
}
