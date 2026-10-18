import {
    collection,
    deleteDoc,
    doc,
    endAt,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAt,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

import { NOTIFICATION_TYPES } from "../../../config/notification-types.js";
import { db } from "../../../firebase/index.js";
import { createNotification } from "../../../services/notification-service.js";

const REQUEST_LIMIT = 100;
const SEARCH_LIMIT = 12;

function requiredId(value, label) {
    const id = String(value || "").trim();
    if (!id) throw new TypeError(`A ${label} is required.`);
    if (id.includes("/")) throw new TypeError(`The ${label} is invalid.`);
    return id;
}

function connectionId(firstUserId, secondUserId) {
    return [
        requiredId(firstUserId, "user ID"),
        requiredId(secondUserId, "friend ID")
    ]
        .sort()
        .join("_");
}

function requestReference(firstUserId, secondUserId) {
    return doc(db, "friendRequests", connectionId(firstUserId, secondUserId));
}

function friendReference(firstUserId, secondUserId) {
    return doc(db, "friends", connectionId(firstUserId, secondUserId));
}

function profileFromSnapshot(snapshot) {
    const data = snapshot?.data?.() || {};
    return {
        id: snapshot.id,
        displayName: String(data.displayName || "Student"),
        email: String(data.email || ""),
        photoURL: data.photoURL || null
    };
}

async function loadProfiles(userIds) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const entries = await Promise.all(
        uniqueIds.map(async (userId) => {
            const snapshot = await getDoc(doc(db, "users", userId));
            return [
                userId,
                snapshot.exists()
                    ? profileFromSnapshot(snapshot)
                    : {
                          id: userId,
                          displayName: "Student",
                          email: "",
                          photoURL: null
                      }
            ];
        })
    );
    return new Map(entries);
}

function requestModel(snapshot, currentUserId, profiles) {
    const data = snapshot.data();
    const otherUserId =
        data.senderId === currentUserId ? data.receiverId : data.senderId;
    return {
        id: snapshot.id,
        ...data,
        person: profiles.get(otherUserId)
    };
}

export async function getConnections(userId) {
    const cleanUserId = requiredId(userId, "user ID");
    const [incomingSnapshot, outgoingSnapshot, friendsSnapshot] =
        await Promise.all([
            getDocs(
                query(
                    collection(db, "friendRequests"),
                    where("receiverId", "==", cleanUserId),
                    limit(REQUEST_LIMIT)
                )
            ),
            getDocs(
                query(
                    collection(db, "friendRequests"),
                    where("senderId", "==", cleanUserId),
                    limit(REQUEST_LIMIT)
                )
            ),
            getDocs(
                query(
                    collection(db, "friends"),
                    where("participantIds", "array-contains", cleanUserId),
                    limit(REQUEST_LIMIT)
                )
            )
        ]);
    const incomingDocuments = incomingSnapshot.docs.filter(
        (item) => item.data().status === "pending"
    );
    const outgoingDocuments = outgoingSnapshot.docs.filter(
        (item) => item.data().status === "pending"
    );
    const friendDocuments = friendsSnapshot.docs;
    const profileIds = [
        ...incomingDocuments.map((item) => item.data().senderId),
        ...outgoingDocuments.map((item) => item.data().receiverId),
        ...friendDocuments.flatMap((item) => item.data().participantIds || [])
    ].filter((id) => id !== cleanUserId);
    const profiles = await loadProfiles(profileIds);

    return {
        friends: friendDocuments.map((item) => {
            const data = item.data();
            const friendId = data.participantIds.find(
                (participantId) => participantId !== cleanUserId
            );
            return { id: item.id, ...data, person: profiles.get(friendId) };
        }),
        incoming: incomingDocuments.map((item) =>
            requestModel(item, cleanUserId, profiles)
        ),
        outgoing: outgoingDocuments.map((item) =>
            requestModel(item, cleanUserId, profiles)
        )
    };
}

export async function searchPeople(userId, searchTerm) {
    const cleanUserId = requiredId(userId, "user ID");
    const term = String(searchTerm || "").trim();
    if (term.length < 2) return [];

    const users = collection(db, "users");
    const peopleQuery = term.includes("@")
        ? query(
              users,
              where("email", "==", term.toLowerCase()),
              where("profileVisibility", "==", "public"),
              limit(SEARCH_LIMIT)
          )
        : query(
              users,
              where("profileVisibility", "==", "public"),
              orderBy("displayName"),
              startAt(term),
              endAt(`${term}\uf8ff`),
              limit(SEARCH_LIMIT)
          );
    const snapshot = await getDocs(peopleQuery);
    return snapshot.docs
        .filter((item) => item.id !== cleanUserId)
        .map(profileFromSnapshot);
}

export async function sendFriendRequest(sender, receiverId) {
    const senderId = requiredId(sender?.id || sender?.uid, "sender ID");
    const cleanReceiverId = requiredId(receiverId, "receiver ID");
    if (senderId === cleanReceiverId) {
        throw new TypeError("You cannot send a friend request to yourself.");
    }
    const [friendSnapshot, existingRequest] = await Promise.all([
        getDoc(friendReference(senderId, cleanReceiverId)),
        getDoc(requestReference(senderId, cleanReceiverId))
    ]);
    if (friendSnapshot.exists()) throw new Error("You are already friends.");
    if (existingRequest.exists()) {
        const data = existingRequest.data();
        if (data.status === "pending") {
            throw new Error(
                data.senderId === senderId
                    ? "Friend request already sent."
                    : "This student has already sent you a request."
            );
        }
        await deleteDoc(existingRequest.ref);
    }

    const reference = requestReference(senderId, cleanReceiverId);
    const timestamp = serverTimestamp();
    await setDoc(reference, {
        createdAt: timestamp,
        receiverId: cleanReceiverId,
        senderId,
        status: "pending",
        updatedAt: timestamp
    });
    try {
        await createNotification(cleanReceiverId, {
            eventId: `friend-request-${reference.id}`,
            message: `${sender.displayName || "A student"} sent you a friend request.`,
            referenceId: reference.id,
            route: "/app/friends?tab=requests",
            senderId,
            senderName: sender.displayName || "Student",
            title: "New friend request",
            type: NOTIFICATION_TYPES.FRIEND_REQUEST
        });
    } catch (error) {
        await deleteDoc(reference).catch(() => {});
        throw error;
    }
    return reference.id;
}

export async function acceptFriendRequest(user, request) {
    const userId = requiredId(user?.id || user?.uid, "user ID");
    if (request.receiverId !== userId) {
        throw new TypeError("Only the recipient can accept this request.");
    }
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    const requestDoc = doc(
        db,
        "friendRequests",
        requiredId(request.id, "request ID")
    );
    const friendDoc = friendReference(request.senderId, userId);
    batch.update(requestDoc, { status: "accepted", updatedAt: timestamp });
    batch.set(friendDoc, {
        createdAt: timestamp,
        participantIds: [request.senderId, userId].sort(),
        requestId: request.id
    });
    await batch.commit();
    await createNotification(request.senderId, {
        eventId: `friend-accepted-${request.id}`,
        message: `${user.displayName || "A student"} accepted your friend request.`,
        referenceId: request.id,
        route: "/app/friends",
        senderId: userId,
        senderName: user.displayName || "Student",
        title: "Friend request accepted",
        type: NOTIFICATION_TYPES.FRIEND_ACCEPTED
    });
    return friendDoc.id;
}

export async function declineFriendRequest(userId, request) {
    if (request.receiverId !== requiredId(userId, "user ID")) {
        throw new TypeError("Only the recipient can decline this request.");
    }
    await updateDoc(doc(db, "friendRequests", request.id), {
        status: "declined",
        updatedAt: serverTimestamp()
    });
}

export async function cancelFriendRequest(userId, request) {
    if (request.senderId !== requiredId(userId, "user ID")) {
        throw new TypeError("Only the sender can cancel this request.");
    }
    await deleteDoc(doc(db, "friendRequests", request.id));
}

export async function removeFriend(userId, friend) {
    const cleanUserId = requiredId(userId, "user ID");
    if (!friend.participantIds?.includes(cleanUserId)) {
        throw new TypeError("You can only remove your own friends.");
    }
    await deleteDoc(doc(db, "friends", requiredId(friend.id, "friend ID")));
}
