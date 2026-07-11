import { auth } from "../firebase.js";
import { createCommentCard } from "../components/comment-card.js";
import { createEmptyState } from "../components/empty-state.js";
import { subscribeToComments } from "../services/comments-service.js";

export function renderCommentCards(comments) {
    const list =
    document.getElementById("commentsList");

    if (!list) {
        return;
    }

    if (!comments.length) {
        list.innerHTML =
        createEmptyState(
            "No comments yet",
            "Ask the first question or start a discussion.",
            "💬"
        );

        return;
    }

    list.innerHTML =
    comments
        .map((comment) =>
            createCommentCard(
                comment,
                auth.currentUser?.uid
            )
        )
        .join("");
}

export function subscribeAndRenderComments(resourceId) {
    if (!resourceId) {
        return () => {};
    }

    return subscribeToComments(
        resourceId,
        (comments) => {
            renderCommentCards(comments);
        }
    );
}
