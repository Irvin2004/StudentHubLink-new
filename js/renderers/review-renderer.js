"use strict";

import { createEmptyState } from "../components/empty-state.js";
import { createRatingStars } from "../components/rating-stars.js";
import { createReviewCard } from "../components/review-card.js";

/**
 * Renders a resource's review summary and review cards.
 *
 * @param {object} options
 * @param {object} options.resource
 * @param {Array<object>} options.reviews
 * @param {string} [options.currentUserId]
 * @param {Element} options.summary
 * @param {Element} options.container
 * @returns {string}
 */
export function renderReviews({
    resource = {},
    reviews = [],
    currentUserId = "",
    summary,
    container
} = {}) {
    if (!summary || !container) {
        throw new TypeError(
            "Review summary and container are required."
        );
    }

    const reviewList = Array.isArray(reviews) ? reviews : [];

    summary.innerHTML = createRatingStars(
        resource.averageRating || 0,
        resource.reviewCount || 0
    );

    const html = reviewList.length
        ? reviewList
            .map((review) =>
                createReviewCard(review, currentUserId)
            )
            .join("")
        : createEmptyState(
            "No reviews yet",
            "Be the first to review this resource.",
            ""
        );

    container.innerHTML = html;
    return html;
}
