import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth.js";
import {
    createCommunity as createCommunityRecord,
    getCommunities,
    getCommunityMembershipIds,
    joinCommunity as joinCommunityRecord,
    leaveCommunity as leaveCommunityRecord
} from "../services/community-service.js";
import { captureError, trackEvent } from "../services/observability-service.js";

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
    const [joinedCommunityIds, setJoinedCommunityIds] = useState(
        () => new Set()
    );
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);
    const pendingMembershipsRef = useRef(new Set());

    const adjustMemberCount = useCallback((communityId, amount) => {
        setCommunities((current) =>
            current.map((community) =>
                community.id === communityId
                    ? {
                          ...community,
                          memberCount: Math.max(
                              0,
                              Number(community.memberCount || 0) + amount
                          )
                      }
                    : community
            )
        );
    }, []);

    const refreshCommunities = useCallback(async () => {
        if (!enabled) return [];

        setLoading(true);
        setError(null);

        try {
            const [nextCommunities, membershipIds] = await Promise.all([
                getCommunities({
                    visibility,
                    category,
                    maxResults
                }),
                userId ? getCommunityMembershipIds(userId) : []
            ]);

            setCommunities(nextCommunities);
            setJoinedCommunityIds(new Set(membershipIds));
            return nextCommunities;
        } catch (nextError) {
            setError(nextError);
            throw nextError;
        } finally {
            setLoading(false);
        }
    }, [category, enabled, maxResults, userId, visibility]);

    useEffect(() => {
        if (!enabled) return undefined;

        let active = true;

        void Promise.resolve()
            .then(() => {
                if (active) {
                    setLoading(true);
                    setError(null);
                }

                return Promise.all([
                    getCommunities({ visibility, category, maxResults }),
                    userId ? getCommunityMembershipIds(userId) : []
                ]);
            })
            .then(([nextCommunities, membershipIds]) => {
                if (!active) return;
                setCommunities(nextCommunities);
                setJoinedCommunityIds(new Set(membershipIds));
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
    }, [category, enabled, maxResults, userId, visibility]);

    const createCommunity = useCallback(
        async (input) => {
            if (!userId) {
                throw new Error("Authentication is required.");
            }

            const community = await createCommunityRecord(input, userId);

            setCommunities((current) => [community, ...current]);
            setJoinedCommunityIds((current) =>
                new Set(current).add(community.id)
            );
            return community;
        },
        [userId]
    );

    const joinCommunity = useCallback(
        async (communityId, nickname = null) => {
            if (!userId) {
                throw new Error("Authentication is required.");
            }

            if (pendingMembershipsRef.current.has(communityId)) {
                throw new Error("A membership update is already in progress.");
            }

            pendingMembershipsRef.current.add(communityId);
            adjustMemberCount(communityId, 1);
            setJoinedCommunityIds((current) =>
                new Set(current).add(communityId)
            );

            try {
                const membership = await joinCommunityRecord(
                    communityId,
                    userId,
                    nickname
                );
                trackEvent("community_joined", { communityId });
                return membership;
            } catch (nextError) {
                adjustMemberCount(communityId, -1);
                setJoinedCommunityIds((current) => {
                    const next = new Set(current);
                    next.delete(communityId);
                    return next;
                });
                captureError(nextError, {
                    feature: "join_community",
                    recoverable: true
                });
                throw nextError;
            } finally {
                pendingMembershipsRef.current.delete(communityId);
            }
        },
        [adjustMemberCount, userId]
    );

    const leaveCommunity = useCallback(
        async (communityId) => {
            if (!userId) {
                throw new Error("Authentication is required.");
            }

            if (pendingMembershipsRef.current.has(communityId)) {
                throw new Error("A membership update is already in progress.");
            }

            pendingMembershipsRef.current.add(communityId);
            adjustMemberCount(communityId, -1);
            setJoinedCommunityIds((current) => {
                const next = new Set(current);
                next.delete(communityId);
                return next;
            });

            try {
                await leaveCommunityRecord(communityId, userId);
                trackEvent("community_left", { communityId });
            } catch (nextError) {
                adjustMemberCount(communityId, 1);
                setJoinedCommunityIds((current) =>
                    new Set(current).add(communityId)
                );
                captureError(nextError, {
                    feature: "leave_community",
                    recoverable: true
                });
                throw nextError;
            } finally {
                pendingMembershipsRef.current.delete(communityId);
            }
        },
        [adjustMemberCount, userId]
    );

    return {
        communities,
        loading,
        error,
        joinedCommunityIds,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        refreshCommunities
    };
}
