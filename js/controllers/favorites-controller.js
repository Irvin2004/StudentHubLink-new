import { auth } from "../firebase.js";
import { toggleFavorite } from "../services/favorites-service.js";
import { handleError } from "../utils/error-handler.js";
import { showToast } from "../utils/toast.js";

function updateFavoriteButton(button, isFavorite) {
    const label =
    isFavorite ? "Remove from favorites" : "Add to favorites";

    button.classList.toggle("active", isFavorite);
    button.innerHTML =
    isFavorite ? "&hearts;" : "&#9825;";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
}

export function initializeFavoriteButtons() {
    document.addEventListener("click", async (event) => {
        const button =
        event.target.closest(".favorite-btn");

        if (!button) return;

        const user =
        auth.currentUser;

        if (!user) {
            showToast("Please log in first.", "warning");
            return;
        }

        const resourceId =
        button.dataset.favoriteId;

        if (!resourceId) {
            showToast("Resource not found.", "error");
            return;
        }

        button.disabled = true;

        try {
            const result =
            await toggleFavorite(user.uid, resourceId);

            updateFavoriteButton(button, result.isFavorite);
            showToast(result.message, "success");
        } catch (error) {
            handleError(error, "Unable to update favorites.");
        } finally {
            button.disabled = false;
        }
    });
}
