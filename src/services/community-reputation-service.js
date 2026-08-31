import {
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query
} from "firebase/firestore";

import { db } from "../firebase/index.js";
import { createCommunityReputation } from "../models/community-reputation.js";

function reputationCollection(communityId) {
    if (!communityId) throw new TypeError("A community ID is required.");
    return collection(db, "communities", communityId, "reputation");
}

export async function getCommunityReputation(communityId, userId) {
    if (!userId) throw new TypeError("A user ID is required.");
    const snapshot = await getDoc(
        doc(reputationCollection(communityId), userId)
    );
    return createCommunityReputation(
        snapshot.exists()
            ? { userId: snapshot.id, ...snapshot.data() }
            : { userId }
    );
}

export function subscribeCommunityReputation(
    communityId,
    userId,
    onData,
    onError
) {
    if (!userId) throw new TypeError("A user ID is required.");
    return onSnapshot(
        doc(reputationCollection(communityId), userId),
        (snapshot) =>
            onData(
                createCommunityReputation(
                    snapshot.exists()
                        ? { userId: snapshot.id, ...snapshot.data() }
                        : { userId }
                )
            ),
        onError
    );
}

export function subscribeCommunityLeaderboard(
    communityId,
    onData,
    onError,
    maximum = 5
) {
    const leaderboardQuery = query(
        reputationCollection(communityId),
        orderBy("points", "desc"),
        limit(maximum * 4)
    );
    return onSnapshot(
        leaderboardQuery,
        (snapshot) =>
            onData(
                snapshot.docs
                    .filter(
                        (item) =>
                            Number(item.data().points || 0) > 0 &&
                            item.data().activeMember !== false
                    )
                    .slice(0, maximum)
                    .map((item) =>
                        createCommunityReputation({
                            userId: item.id,
                            ...item.data()
                        })
                    )
            ),
        onError
    );
}
