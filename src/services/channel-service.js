import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";

import { auth, db } from "../firebase/index.js";
import { ACTIVITY_TYPES } from "../config/activity-types.js";
import {
    createChannelModel,
    normalizeChannelName,
    validateChannelInput
} from "../models/channel.js";
import { createActivity } from "./activity-service.js";

const COMMUNITIES_COLLECTION = "communities";
const CHANNELS_COLLECTION = "channels";
const CHANNEL_LIMIT = 100;

function requireCommunityId(communityId) {
    if (!communityId) {
        throw new TypeError("A community ID is required.");
    }

    return String(communityId);
}

function requireUserId(userId) {
    const resolvedUserId = userId || auth.currentUser?.uid;

    if (!resolvedUserId) {
        throw new Error("An authenticated user is required.");
    }

    return resolvedUserId;
}

function getChannelsReference(communityId) {
    return collection(
        db,
        COMMUNITIES_COLLECTION,
        requireCommunityId(communityId),
        CHANNELS_COLLECTION
    );
}

function getChannelReference(communityId, channelId) {
    if (!channelId) {
        throw new TypeError("A channel ID is required.");
    }

    return doc(
        db,
        COMMUNITIES_COLLECTION,
        requireCommunityId(communityId),
        CHANNELS_COLLECTION,
        String(channelId)
    );
}

function channelFromSnapshot(snapshot, communityId) {
    return createChannelModel({
        id: snapshot.id,
        communityId,
        ...snapshot.data()
    });
}

async function assertUniqueName(communityId, name, excludedChannelId = null) {
    const snapshot = await getDocs(
        query(
            getChannelsReference(communityId),
            where("name", "==", name),
            limit(2)
        )
    );
    const duplicate = snapshot.docs.find(
        (channelDocument) =>
            channelDocument.id !== excludedChannelId &&
            normalizeChannelName(channelDocument.data().name) === name
    );

    if (duplicate) {
        throw new Error("A channel with this name already exists.");
    }
}

async function getNextPosition(communityId) {
    const snapshot = await getDocs(
        query(
            getChannelsReference(communityId),
            orderBy("position", "desc"),
            limit(1)
        )
    );
    const lastPosition = Number(snapshot.docs[0]?.data().position ?? -1);
    return Math.max(0, lastPosition + 1);
}

export async function getChannels(communityId) {
    const channelQuery = query(
        getChannelsReference(communityId),
        orderBy("position", "asc"),
        limit(CHANNEL_LIMIT)
    );
    const snapshot = await getDocs(channelQuery);

    return snapshot.docs.map((channelDocument) =>
        channelFromSnapshot(channelDocument, communityId)
    );
}

export function subscribeToChannels(communityId, onData, onError) {
    const channelQuery = query(
        getChannelsReference(communityId),
        orderBy("position", "asc"),
        limit(CHANNEL_LIMIT)
    );

    return onSnapshot(
        channelQuery,
        (snapshot) => {
            onData(
                snapshot.docs.map((channelDocument) =>
                    channelFromSnapshot(channelDocument, communityId)
                )
            );
        },
        onError
    );
}

export async function createChannel(communityId, input, userId) {
    const createdBy = requireUserId(userId);
    const validated = validateChannelInput(input);
    const [, position] = await Promise.all([
        assertUniqueName(communityId, validated.name),
        getNextPosition(communityId)
    ]);
    const reference = doc(getChannelsReference(communityId));
    const timestamp = serverTimestamp();
    const data = {
        ...validated,
        communityId: requireCommunityId(communityId),
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
        position
    };

    await setDoc(reference, data);
    const actorName =
        String(
            auth.currentUser?.displayName ||
                auth.currentUser?.email?.split("@")[0] ||
                "A community admin"
        ).trim() || "A community admin";

    void createActivity(communityId, {
        type: ACTIVITY_TYPES.CHANNEL_CREATED,
        actorId: createdBy,
        actorName,
        title: `${actorName} created #${validated.name}`,
        description:
            validated.description || "A new channel is ready for members.",
        channelId: reference.id,
        referenceId: reference.id
    }).catch(() => {});

    return createChannelModel({ id: reference.id, ...data });
}

export async function updateChannel(communityId, channelId, updates, userId) {
    requireUserId(userId);

    if (channelId === "general" && updates.name) {
        throw new Error("#general cannot be renamed.");
    }

    const validated = validateChannelInput(
        {
            name: updates.name,
            description: updates.description,
            type: updates.type
        },
        { allowReserved: channelId === "general" }
    );

    await assertUniqueName(communityId, validated.name, channelId);
    const data = {
        ...validated,
        updatedAt: serverTimestamp()
    };

    await updateDoc(getChannelReference(communityId, channelId), data);
    return data;
}

export async function deleteChannel(communityId, channelId, userId) {
    requireUserId(userId);

    if (channelId === "general") {
        throw new Error("#general cannot be deleted.");
    }

    await deleteDoc(getChannelReference(communityId, channelId));
}
