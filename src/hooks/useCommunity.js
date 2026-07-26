import { useEffect, useState } from "react";

import { COMMUNITY_ROLES } from "../config/community-roles.js";
import {
    getCommunity,
    getCommunityMember
} from "../services/community-service.js";
import { useAuth } from "./useAuth.js";

export function useCommunity(communityId) {
    const { user } = useAuth();
    const [community, setCommunity] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(Boolean(communityId));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!communityId || !user?.uid) return undefined;

        let active = true;

        void Promise.all([
            getCommunity(communityId),
            getCommunityMember(communityId, user.uid)
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
                        (nextCommunity.ownerId === user.uid
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
    }, [communityId, user?.uid]);

    return { community, role, loading, error };
}
