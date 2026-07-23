import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import {
    emitFriendRequestAccepted,
    emitFriendRequestSent
} from "../events/friend-events.js";
import { error as logError } from "../utils/logger.js";

const FRIEND_REQUESTS_COLLECTION = "friendRequests";
const FRIENDS_COLLECTION = "friends";

function validateId(value, fieldName) {
    const cleanValue = typeof value === "string" ? value.trim() : "";

    if (!cleanValue) {
        throw new Error(`${fieldName} is required.`);
    }

    return cleanValue;
}

function mapFriendRequest(requestDocument) {
    return {
        id: requestDocument.id,
        ...requestDocument.data()
    };
}

async function getPendingRequest(senderId, recipientId) {
    const requestsQuery = query(
        collection(db, FRIEND_REQUESTS_COLLECTION),
        where("senderId", "==", senderId),
        where("receiverId", "==", recipientId)
    );
    const snapshot = await getDocs(requestsQuery);
    const pendingRequest = snapshot.docs.find(
        (requestDocument) => requestDocument.data().status === "pending"
    );

    return pendingRequest ? mapFriendRequest(pendingRequest) : null;
}

async function findExistingPendingRequest(senderId, recipientId) {
    const [outgoingRequest, incomingRequest] = await Promise.all([
        getPendingRequest(senderId, recipientId),
        getPendingRequest(recipientId, senderId)
    ]);

    return outgoingRequest || incomingRequest;
}

export async function sendFriendRequest(senderId, recipientId) {
    const cleanSenderId = validateId(senderId, "Sender ID");
    const cleanRecipientId = validateId(recipientId, "Recipient ID");

    if (cleanSenderId === cleanRecipientId) {
        throw new Error("You cannot send a friend request to yourself.");
    }

    const existingRequest = await findExistingPendingRequest(
        cleanSenderId,
        cleanRecipientId
    );

    if (existingRequest) {
        return existingRequest;
    }

    const requestReference = await addDoc(
        collection(db, FRIEND_REQUESTS_COLLECTION),
        {
            senderId: cleanSenderId,
            receiverId: cleanRecipientId,
            status: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );
    const friendRequest = {
        id: requestReference.id,
        senderId: cleanSenderId,
        receiverId: cleanRecipientId,
        status: "pending"
    };

    try {
        await emitFriendRequestSent({
            senderId: cleanSenderId,
            recipientId: cleanRecipientId,
            requestId: requestReference.id
        });
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            "Friend request notification event failed:",
            error
        );
    }

    return friendRequest;
}

export async function acceptFriendRequest(requestId, recipientId) {
    const cleanRequestId = validateId(requestId, "Friend request ID");
    const cleanRecipientId = validateId(recipientId, "Recipient ID");
    const requestReference = doc(
        db,
        FRIEND_REQUESTS_COLLECTION,
        cleanRequestId
    );
    const requestSnapshot = await getDoc(requestReference);

    if (!requestSnapshot.exists()) {
        throw new Error("Friend request not found.");
    }

    const friendRequest = requestSnapshot.data();

    if (friendRequest.receiverId !== cleanRecipientId) {
        throw new Error("Only the recipient can accept this friend request.");
    }

    if (friendRequest.status === "accepted") {
        return mapFriendRequest(requestSnapshot);
    }

    if (friendRequest.status !== "pending") {
        throw new Error("Friend request is no longer pending.");
    }

    const batch = writeBatch(db);
    const friendReference = doc(db, FRIENDS_COLLECTION, cleanRequestId);

    batch.update(requestReference, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    batch.set(friendReference, {
        participantIds: [friendRequest.senderId, cleanRecipientId],
        requestId: cleanRequestId,
        createdAt: serverTimestamp()
    });
    await batch.commit();

    try {
        await emitFriendRequestAccepted({
            senderId: friendRequest.senderId,
            recipientId: cleanRecipientId,
            requestId: cleanRequestId
        });
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            "Friend acceptance notification event failed:",
            error
        );
    }

    return {
        id: cleanRequestId,
        ...friendRequest,
        status: "accepted"
    };
}
