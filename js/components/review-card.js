import { createRatingStars } from "./rating-stars.js";
import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format-date.js";

export function createReviewCard(review, currentUserId = null) {
    const isOwner =
    currentUserId === review.userId;

    return `
        <article class="review-card">
            <header class="review-header">
                <div>
                    <h4>${escapeHtml(review.userName || "Student")}</h4>

                    ${createRatingStars(review.rating, 0)}
                </div>
            </header>

            <p class="review-text">
                ${escapeHtml(review.review || "")}
            </p>

            <footer class="review-footer">
                <small>
                    ${escapeHtml(formatDate(review.createdAt))}
                </small>

                ${
                    isOwner
                    ? `
                        <div class="review-actions">
                            <button
                                class="edit-review-btn"
                                type="button"
                                data-review-id="${escapeHtml(review.id)}">
                                Edit
                            </button>

                            <button
                                class="delete-review-btn"
                                type="button"
                                data-review-id="${escapeHtml(review.id)}">
                                Delete
                            </button>
                        </div>
                    `
                    : ""
                }
            </footer>
        </article>
    `;
}
