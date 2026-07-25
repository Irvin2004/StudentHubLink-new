import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc
} from "firebase/firestore";

import { auth, db } from "../firebase/index.js";
import {
    createChannelModel,
    normalizeChannelName,
    validateChannelInput
} from "../models/channel.js";

const COMMUNITIES_COLLECTION = "communities";
const CHANNELS_COLLECTION = "channels";

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
    const snapshot = await getDocs(getChannelsReference(communityId));
    const duplicate = snapshot.docs.find(
        (channelDocument) =>
            channelDocument.id !== excludedChannelId &&
            normalizeChannelName(channelDocument.data().name) === name
    );

    if (duplicate) {
        throw new Error("A channel with this name already exists.");
    }

    return snapshot.size;
}

export async function getChannels(communityId) {
    const channelQuery = query(
        getChannelsReference(communityId),
        orderBy("position", "asc")
    );
    const snapshot = await getDocs(channelQuery);

    return snapshot.docs.map((channelDocument) =>
        channelFromSnapshot(channelDocument, communityId)
    );
}

export function subscribeToChannels(communityId, onData, onError) {
    const channelQuery = query(
        getChannelsReference(communityId),
        orderBy("position", "asc")
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
    const position = await assertUniqueName(communityId, validated.name);
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
