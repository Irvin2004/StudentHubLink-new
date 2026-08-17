import { useCallback, useEffect, useRef, useState } from "react";

import { COMMUNITY_ROLES } from "../config/community-roles.js";
import {
    deleteCommunity as deleteCommunityRecord,
    getCommunity,
    getCommunityMember,
    getCommunityMembersPage,
    leaveCommunity as leaveCommunityRecord,
    removeMember as removeMemberRecord,
    updateCommunity as updateCommunityRecord,
    updateMemberRole as updateMemberRoleRecord
} from "../services/community-service.js";
import { useAuth } from "./useAuth.js";

export function useCommunity(communityId, options = {}) {
    const { user } = useAuth();
    const userId = user?.uid ?? null;
    const membersEnabled = options.loadMembers === true;
    const [community, setCommunity] = useState(null);
    const [role, setRole] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(Boolean(communityId));
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersLoadingMore, setMembersLoadingMore] = useState(false);
    const [hasMoreMembers, setHasMoreMembers] = useState(false);
    const [error, setError] = useState(null);
    const [membersError, setMembersError] = useState(null);
    const membersCursorRef = useRef(null);
    const membersRequestRef = useRef(false);

    const loadCommunity = useCallback(async () => {
        if (!communityId || !userId) return null;

        setLoading(true);
        setError(null);
        try {
            const [nextCommunity, membership] = await Promise.all([
                getCommunity(communityId),
                getCommunityMember(communityId, userId)
            ]);

            if (!nextCommunity) {
                const notFound = new Error("This community no longer exists.");
                notFound.code = "community/not-found";
                throw notFound;
            }

            setCommunity(nextCommunity);
            setRole(
                membership?.role ||
                    (nextCommunity.ownerId === userId
                        ? COMMUNITY_ROLES.OWNER
                        : null)
            );
            return nextCommunity;
        } catch (nextError) {
            setError(nextError);
            throw nextError;
        } finally {
            setLoading(false);
        }
    }, [communityId, userId]);

    const loadMembers = useCallback(
        async ({ append = false } = {}) => {
            if (!communityId || membersRequestRef.current) return [];

            membersRequestRef.current = true;
            if (append) setMembersLoadingMore(true);
            else setMembersLoading(true);
            setMembersError(null);

            try {
                const page = await getCommunityMembersPage(communityId, {
                    cursor: append ? membersCursorRef.current : null
                });
                membersCursorRef.current = page.cursor;
                setHasMoreMembers(page.hasMore);
                setMembers((current) => {
                    if (!append) return page.members;
                    const known = new Set(
                        current.map((member) => member.userId)
                    );
                    return [
                        ...current,
                        ...page.members.filter(
                            (member) => !known.has(member.userId)
                        )
                    ];
                });
                return page.members;
            } catch (nextError) {
                setMembersError(nextError);
                throw nextError;
            } finally {
                membersRequestRef.current = false;
                setMembersLoading(false);
                setMembersLoadingMore(false);
            }
        },
        [communityId]
    );

    useEffect(() => {
        if (!communityId || !userId) return undefined;
        let active = true;

        void Promise.all([
            getCommunity(communityId),
            getCommunityMember(communityId, userId)
        ])
            .then(([nextCommunity, membership]) => {
                if (!active) return;
                if (!nextCommunity) {
                    const notFound = new Error(
                        "This community no longer exists."
                    );
                    notFound.code = "community/not-found";
                    throw notFound;
                }
                setCommunity(nextCommunity);
                setRole(
                    membership?.role ||
                        (nextCommunity.ownerId === userId
                            ? COMMUNITY_ROLES.OWNER
                            : null)
                );
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
    }, [communityId, userId]);

    useEffect(() => {
        if (!membersEnabled) return;
        void Promise.resolve()
            .then(() => loadMembers())
            .catch(() => {});
    }, [loadMembers, membersEnabled]);

    const saveCommunity = useCallback(
        async (updates) => {
            const updated = await updateCommunityRecord(communityId, updates);
            await loadCommunity();
            return updated;
        },
        [communityId, loadCommunity]
    );

    const deleteCommunity = useCallback(
        () => deleteCommunityRecord(communityId),
        [communityId]
    );

    const leaveCommunity = useCallback(
        () => leaveCommunityRecord(communityId, userId),
        [communityId, userId]
    );

    const removeCommunityMember = useCallback(
        async (memberId) => {
            await removeMemberRecord(communityId, memberId);
            await Promise.all([loadCommunity(), loadMembers()]);
        },
        [communityId, loadCommunity, loadMembers]
    );

    const changeCommunityMemberRole = useCallback(
        async (memberId, nextRole) => {
            const updated = await updateMemberRoleRecord(
                communityId,
                memberId,
                nextRole
            );
            await loadMembers();
            return updated;
        },
        [communityId, loadMembers]
    );

    return {
        community,
        role,
        members,
        loading,
        membersLoading,
        membersLoadingMore,
        hasMoreMembers,
        error,
        membersError,
        refreshCommunity: loadCommunity,
        refreshMembers: loadMembers,
        loadMoreMembers: () => loadMembers({ append: true }),
        saveCommunity,
        deleteCommunity,
        leaveCommunity,
        removeCommunityMember,
        changeCommunityMemberRole
    };
}
