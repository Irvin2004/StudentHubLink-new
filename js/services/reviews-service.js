import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function addReview({
    resourceId,
    userId,
    userName,
    rating,
    review
}) {
    if (!resourceId || !userId) {
        throw new Error("Resource and user details are required.");
    }

    const existingReview =
        await getUserReview(resourceId, userId);

    if (existingReview) {
        throw new Error("You have already reviewed this resource.");
    }

    const reviewRef = await addDoc(
        collection(db, COLLECTIONS.REVIEWS),
        {
            resourceId,
            userId,
            userName: userName || "Student",
            rating: Number(rating),
            review: review.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    return reviewRef.id;
}

export async function getReviewsForResource(resourceId) {
    const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where("resourceId", "==", resourceId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(reviewsQuery);

    return snapshot.docs.map((reviewDoc) => ({
        id: reviewDoc.id,
        ...reviewDoc.data()
    }));
}

export async function getUserReview(resourceId, userId) {
    const reviewQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where("resourceId", "==", resourceId),
        where("userId", "==", userId)
    );

    const snapshot = await getDocs(reviewQuery);

    if (snapshot.empty) {
        return null;
    }

    const reviewDoc = snapshot.docs[0];

    return {
        id: reviewDoc.id,
        ...reviewDoc.data()
    };
}

export async function updateReview({
    reviewId,
    rating,
    review
}) {
    await updateDoc(
        doc(db, COLLECTIONS.REVIEWS, reviewId),
        {
            rating: Number(rating),
            review: review.trim(),
            updatedAt: serverTimestamp()
        }
    );
}

export async function deleteReview(reviewId) {
    await deleteDoc(
        doc(db, COLLECTIONS.REVIEWS, reviewId)
    );
}
