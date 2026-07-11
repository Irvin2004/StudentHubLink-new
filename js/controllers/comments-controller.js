import { auth } from "../firebase.js";
import { addComment } from "../services/comments-service.js";
import { showToast } from "../utils/toast.js";
import { handleError } from "../utils/error-handler.js";

export function initializeCommentForm(resourceId) {
    const form =
    document.getElementById("commentForm");

    if (!form || !resourceId) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user =
        auth.currentUser;

        if (!user) {
            showToast(
                "Please log in first.",
                "warning"
            );

            return;
        }

        try {
            await addComment({
                resourceId,
                userId: user.uid,
                userName:
                    user.displayName || "Student",
                message:
                    document
                        .getElementById("commentInput")
                        .value
            });

            form.reset();

            showToast(
                "Comment posted.",
                "success"
            );
        } catch (error) {
            handleError(
                error,
                "Unable to post comment."
            );
        }
    });
}
