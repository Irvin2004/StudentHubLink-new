import { auth } from "../firebase.js";
import { createEmptyState } from "../components/empty-state.js";
import { createRatingStars } from "../components/rating-stars.js";
import { createReviewCard } from "../components/review-card.js";
import { getReviewsForResource } from "../services/reviews-service.js";

export async function renderReviews(resource) {
    const summary =
    document.getElementById("reviewSummary");

    const list =
    document.getElementById("reviewsList");

    if (!summary || !list) {
        return;
    }

    const reviews =
    await getReviewsForResource(resource.id);

    summary.innerHTML =
    createRatingStars(
        resource.averageRating || 0,
        resource.reviewCount || 0
    );

    if (!reviews.length) {
        list.innerHTML =
        createEmptyState(
            "No reviews yet",
            "Be the first to review this resource.",
            "⭐"
        );

        return;
    }

    list.innerHTML =
    reviews
        .map((review) =>
            createReviewCard(
                review,
                auth.currentUser?.uid
            )
        )
        .join("");
}
