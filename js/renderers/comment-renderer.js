"use strict";

import { createCommentCard } from "../components/comment-card.js";
import { createEmptyState } from "../components/empty-state.js";

/**
 * Renders comment cards into a supplied container.
 *
 * @param {Array<object>} comments
 * @param {{container: Element, currentUserId?: string}} options
 * @returns {string}
 */
export function renderCommentCards(
    comments = [],
    { container, currentUserId = "" } = {}
) {
    if (!container || !("innerHTML" in container)) {
        throw new TypeError("Comment container is required.");
    }

    const commentList = Array.isArray(comments) ? comments : [];
    const html = commentList.length
        ? commentList
              .map((comment) => createCommentCard(comment, currentUserId))
              .join("")
        : createEmptyState(
              "No comments yet",
              "Ask the first question or start a discussion.",
              ""
          );

    container.innerHTML = html;
    return html;
}
