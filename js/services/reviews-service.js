import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import { COLLECTIONS } from "../config/firestore.js";
import {
    createReviewModel,
    createReviewUpdateModel
} from "../models/review.js";

export async function addReview({
    resourceId,
    userId,
    userName,
    rating,
    review
}) {
    const reviewData = createReviewModel({
        resourceId,
        userId,
        userName,
        rating,
        review
    });

    const existingReview = await getUserReview(resourceId, userId);

    if (existingReview) {
        throw new Error("You have already reviewed this resource.");
    }

    const reviewRef = doc(
        db,
        COLLECTIONS.REVIEWS,
        `${reviewData.resourceId}_${reviewData.userId}`
    );
    await setDoc(reviewRef, {
        ...reviewData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return reviewRef.id;
}

export async function getReviewsForResource(resourceId) {
    const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where("resourceId", "==", resourceId),
        orderBy("createdAt", "desc"),
        limit(100)
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

export async function updateReview({ reviewId, rating, review }) {
    const updates = createReviewUpdateModel({ rating, review });
    await updateDoc(doc(db, COLLECTIONS.REVIEWS, reviewId), {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

export async function deleteReview(reviewId) {
    await deleteDoc(doc(db, COLLECTIONS.REVIEWS, reviewId));
}
