import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format-date.js";

export function createCommentCard(comment, currentUserId = null) {
    const isOwner = comment.userId === currentUserId;

    return `
        <article class="comment-card">
            <div class="comment-header">
                <strong>${escapeHtml(comment.userName || "Student")}</strong>

                <small>
                    ${escapeHtml(formatDate(comment.createdAt))}
                </small>
            </div>

            <p class="comment-message">
                ${escapeHtml(comment.message || "")}
            </p>

            ${
                isOwner
                    ? `
                        <div class="comment-actions">
                            <button
                                class="edit-comment-btn"
                                type="button"
                                data-comment-id="${escapeHtml(comment.id)}">
                                Edit
                            </button>

                            <button
                                class="delete-comment-btn"
                                type="button"
                                data-comment-id="${escapeHtml(comment.id)}">
                                Delete
                            </button>
                        </div>
                    `
                    : ""
            }
        </article>
    `;
}
