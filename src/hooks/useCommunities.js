import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth.js";
import {
    createCommunity as createCommunityRecord,
    getCommunitiesPage,
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
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState(null);
    const pendingMembershipsRef = useRef(new Set());
    const cursorRef = useRef(null);
    const loadingMoreRef = useRef(false);

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
            const [page, membershipIds] = await Promise.all([
                getCommunitiesPage({
                    visibility,
                    category,
                    pageSize: maxResults
                }),
                userId ? getCommunityMembershipIds(userId) : []
            ]);

            cursorRef.current = page.cursor;
            setHasMore(page.hasMore);
            setCommunities(page.communities);
            setJoinedCommunityIds(new Set(membershipIds));
            return page.communities;
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
                    getCommunitiesPage({
                        visibility,
                        category,
                        pageSize: maxResults
                    }),
                    userId ? getCommunityMembershipIds(userId) : []
                ]);
            })
            .then(([page, membershipIds]) => {
                if (!active) return;
                cursorRef.current = page.cursor;
                setHasMore(page.hasMore);
                setCommunities(page.communities);
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

    const loadMore = useCallback(async () => {
        if (!enabled || !hasMore || loadingMoreRef.current) return [];

        loadingMoreRef.current = true;
        setLoadingMore(true);
        try {
            const page = await getCommunitiesPage({
                visibility,
                category,
                cursor: cursorRef.current,
                pageSize: maxResults
            });
            cursorRef.current = page.cursor;
            setHasMore(page.hasMore);
            setCommunities((current) => {
                const known = new Set(current.map((community) => community.id));
                return [
                    ...current,
                    ...page.communities.filter(
                        (community) => !known.has(community.id)
                    )
                ];
            });
            return page.communities;
        } catch (nextError) {
            setError(nextError);
            throw nextError;
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [category, enabled, hasMore, maxResults, visibility]);

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
        hasMore,
        loading,
        loadingMore,
        error,
        joinedCommunityIds,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        loadMore,
        refreshCommunities
    };
}
