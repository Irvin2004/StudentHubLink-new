"use strict";

import { auth } from "../../src/firebase/auth.js";
import {
    addComment,
    subscribeToComments
} from "../services/comments-service.js";
import { renderCommentCards } from "../renderers/comment-renderer.js";
import { handleError, showToast } from "../services/user-feedback-service.js";

/**
 * Creates the comments controller for a resource.
 *
 * @param {object} options
 * @param {string} options.resourceId
 * @param {HTMLFormElement} [options.form]
 * @param {HTMLInputElement|HTMLTextAreaElement} [options.input]
 * @param {Element} [options.container]
 * @returns {{initialize: Function, destroy: Function}}
 */
export function createCommentsController({
    resourceId,
    form = document.getElementById("commentForm"),
    input = document.getElementById("commentInput"),
    container = document.getElementById("commentsList")
} = {}) {
    if (!resourceId) {
        throw new Error("Comments controller requires a resource ID.");
    }

    let unsubscribe = null;
    let initialized = false;

    function render(comments) {
        renderCommentCards(comments, {
            container,
            currentUserId: auth.currentUser?.uid || ""
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const user = auth.currentUser;

        if (!user) {
            showToast("Please log in first.", "warning");
            return;
        }

        try {
            await addComment({
                resourceId,
                userId: user.uid,
                userName: user.displayName || "Student",
                message: input?.value || ""
            });

            form?.reset();
            showToast("Comment posted.", "success");
        } catch (error) {
            handleError(error, "Unable to post comment.");
        }
    }

    function initialize() {
        if (initialized) {
            return;
        }

        if (!container) {
            throw new Error("Comments container is required.");
        }

        unsubscribe = subscribeToComments(resourceId, render);
        form?.addEventListener("submit", handleSubmit);
        initialized = true;
    }

    function destroy() {
        if (!initialized) {
            return;
        }

        unsubscribe?.();
        unsubscribe = null;
        form?.removeEventListener("submit", handleSubmit);
        initialized = false;
    }

    return {
        initialize,
        destroy
    };
}
