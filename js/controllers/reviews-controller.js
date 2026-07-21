import { auth } from "../firebase.js";
import { addReview } from "../services/reviews-service.js";
import { renderReviews } from "../renderers/review-renderer.js";
import { showToast } from "../utils/toast.js";
import { handleError } from "../utils/error-handler.js?security=1";

export function initializeReviewForm(resource) {
    const resourceId =
    typeof resource === "string" ? resource : resource?.id;

    const form =
    document.getElementById("reviewForm");

    if (!form || !resourceId) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user =
        auth.currentUser;

        if (!user) {
            showToast("Please login first.", "warning");
            return;
        }

        try {
            await addReview({
                resourceId,
                userId: user.uid,
                userName:
                    user.displayName || "Student",
                rating:
                    document.getElementById("ratingSelect").value,
                review:
                    document.getElementById("reviewInput").value
            });

            showToast("Review submitted!", "success");

            form.reset();

            await renderReviews({
                ...(typeof resource === "object" ? resource : {}),
                id: resourceId
            });
        } catch (error) {
            handleError(
                error,
                "Unable to submit your review."
            );
        }
    });
}
