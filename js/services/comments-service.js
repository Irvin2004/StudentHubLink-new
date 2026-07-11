import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function addComment({
    resourceId,
    userId,
    userName,
    message
}) {
    const cleanMessage =
    message.trim();

    if (!resourceId || !userId || !cleanMessage) {
        throw new Error("Comment details are incomplete.");
    }

    const commentRef = await addDoc(
        collection(db, COLLECTIONS.COMMENTS),
        {
            resourceId,
            userId,
            userName: userName || "Student",
            message: cleanMessage,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    return commentRef.id;
}

export async function getCommentsForResource(resourceId) {
    const commentsQuery = query(
        collection(db, COLLECTIONS.COMMENTS),
        where("resourceId", "==", resourceId),
        orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(commentsQuery);

    return snapshot.docs.map((commentDoc) => ({
        id: commentDoc.id,
        ...commentDoc.data()
    }));
}

export function subscribeToComments(resourceId, callback) {
    const commentsQuery = query(
        collection(db, COLLECTIONS.COMMENTS),
        where("resourceId", "==", resourceId),
        orderBy("createdAt", "asc")
    );

    return onSnapshot(
        commentsQuery,
        (snapshot) => {
            const comments =
            snapshot.docs.map((commentDoc) => ({
                id: commentDoc.id,
                ...commentDoc.data()
            }));

            callback(comments);
        }
    );
}

export async function updateComment(commentId, message) {
    const cleanMessage =
    message.trim();

    if (!cleanMessage) {
        throw new Error("Comment cannot be empty.");
    }

    await updateDoc(
        doc(db, COLLECTIONS.COMMENTS, commentId),
        {
            message: cleanMessage,
            updatedAt: serverTimestamp()
        }
    );
}

export async function deleteComment(commentId) {
    await deleteDoc(
        doc(db, COLLECTIONS.COMMENTS, commentId)
    );
}
