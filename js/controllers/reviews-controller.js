"use strict";

import { auth } from "../firebase/firebase-config.js";
import {
    addReview,
    getReviewsForResource
} from "../services/reviews-service.js";
import { renderReviews } from "../renderers/review-renderer.js";
import {
    handleError,
    showToast
} from "../services/user-feedback-service.js";

/**
 * Creates the reviews controller for a resource.
 *
 * @param {object} options
 * @param {object} options.resource
 * @param {HTMLFormElement} [options.form]
 * @param {Element} [options.summary]
 * @param {Element} [options.container]
 * @returns {{initialize: Function, refresh: Function, destroy: Function}}
 */
export function createReviewsController({
    resource,
    form = document.getElementById("reviewForm"),
    summary = document.getElementById("reviewSummary"),
    container = document.getElementById("reviewsList")
} = {}) {
    if (!resource?.id) {
        throw new Error("Reviews controller requires a resource.");
    }

    let currentResource = resource;
    let initialized = false;

    async function refresh(updatedResource = currentResource) {
        currentResource = {
            ...currentResource,
            ...updatedResource
        };

        const reviews = await getReviewsForResource(
            currentResource.id
        );

        return renderReviews({
            resource: currentResource,
            reviews,
            currentUserId: auth.currentUser?.uid || "",
            summary,
            container
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
            await addReview({
                resourceId: currentResource.id,
                userId: user.uid,
                userName: user.displayName || "Student",
                rating:
                    document.getElementById("ratingSelect")?.value,
                review:
                    document.getElementById("reviewInput")?.value
            });

            form?.reset();
            showToast("Review submitted!", "success");
            await refresh();
        } catch (error) {
            handleError(error, "Unable to submit your review.");
        }
    }

    async function initialize() {
        if (initialized) {
            return;
        }

        if (!summary || !container) {
            throw new Error("Review containers are required.");
        }

        form?.addEventListener("submit", handleSubmit);
        initialized = true;
        await refresh();
    }

    function destroy() {
        if (!initialized) {
            return;
        }

        form?.removeEventListener("submit", handleSubmit);
        initialized = false;
    }

    return {
        initialize,
        refresh,
        destroy
    };
}
