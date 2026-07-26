const REVIEW_MAX_LENGTH = 1000;
const USER_NAME_MAX_LENGTH = 120;

function requiredText(value, fieldName) {
    const cleanValue = typeof value === "string" ? value.trim() : "";
    if (!cleanValue) throw new Error(`${fieldName} is required.`);
    return cleanValue;
}

function normalizeRating(value) {
    const rating = Number(value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be a whole number from 1 to 5.");
    }
    return rating;
}

function normalizeReview(value) {
    const review = requiredText(value, "Review");
    if (review.length > REVIEW_MAX_LENGTH) {
        throw new Error(
            `Review cannot exceed ${REVIEW_MAX_LENGTH} characters.`
        );
    }
    return review;
}

export function createReviewModel(data = {}) {
    const userName = requiredText(data.userName || "Student", "User name");
    return {
        resourceId: requiredText(data.resourceId, "Resource ID"),
        userId: requiredText(data.userId, "User ID"),
        userName: userName.slice(0, USER_NAME_MAX_LENGTH),
        rating: normalizeRating(data.rating),
        review: normalizeReview(data.review)
    };
}

export function createReviewUpdateModel(data = {}) {
    return {
        rating: normalizeRating(data.rating),
        review: normalizeReview(data.review)
    };
}
