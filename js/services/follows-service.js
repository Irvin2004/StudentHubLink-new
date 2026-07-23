import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase/firebase-config.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function getFollowRecord(
    followerId,
    followingId
) {
    const followsQuery = query(
        collection(db, COLLECTIONS.FOLLOWS),
        where("followerId", "==", followerId),
        where("followingId", "==", followingId)
    );

    const snapshot = await getDocs(followsQuery);

    if (snapshot.empty) {
        return null;
    }

    const followDoc = snapshot.docs[0];

    return {
        id: followDoc.id,
        ...followDoc.data()
    };
}

export async function followUser(
    followerId,
    followingId
) {
    if (!followerId || !followingId) {
        throw new Error("User information is missing.");
    }

    if (followerId === followingId) {
        throw new Error("You cannot follow yourself.");
    }

    const existingFollow =
        await getFollowRecord(followerId, followingId);

    if (existingFollow) {
        return existingFollow;
    }

    const followRef = await addDoc(
        collection(db, COLLECTIONS.FOLLOWS),
        {
            followerId,
            followingId,
            createdAt: serverTimestamp()
        }
    );

    return {
        id: followRef.id,
        followerId,
        followingId
    };
}

export async function unfollowUser(
    followerId,
    followingId
) {
    const follow =
        await getFollowRecord(followerId, followingId);

    if (!follow) {
        return false;
    }

    await deleteDoc(
        doc(db, COLLECTIONS.FOLLOWS, follow.id)
    );

    return true;
}

export async function isFollowing(
    followerId,
    followingId
) {
    const follow =
        await getFollowRecord(followerId, followingId);

    return Boolean(follow);
}

export async function areMutuals(
    firstUserId,
    secondUserId
) {
    const [
        firstFollowsSecond,
        secondFollowsFirst
    ] = await Promise.all([
        isFollowing(firstUserId, secondUserId),
        isFollowing(secondUserId, firstUserId)
    ]);

    return (
        firstFollowsSecond &&
        secondFollowsFirst
    );
}
