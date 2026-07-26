import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import { COLLECTIONS } from "../config/firestore.js";
import {
    createCommentModel,
    createCommentUpdateModel
} from "../models/comment.js";

export async function addComment({ resourceId, userId, userName, message }) {
    const comment = createCommentModel({
        resourceId,
        userId,
        userName,
        message
    });

    const commentRef = await addDoc(collection(db, COLLECTIONS.COMMENTS), {
        ...comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return commentRef.id;
}

export async function getCommentsForResource(resourceId) {
    const commentsQuery = query(
        collection(db, COLLECTIONS.COMMENTS),
        where("resourceId", "==", resourceId),
        orderBy("createdAt", "asc"),
        limit(200)
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
        orderBy("createdAt", "asc"),
        limit(200)
    );

    return onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map((commentDoc) => ({
            id: commentDoc.id,
            ...commentDoc.data()
        }));

        callback(comments);
    });
}

export async function updateComment(commentId, message) {
    const updates = createCommentUpdateModel({ message });

    await updateDoc(doc(db, COLLECTIONS.COMMENTS, commentId), {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

export async function deleteComment(commentId) {
    await deleteDoc(doc(db, COLLECTIONS.COMMENTS, commentId));
}
