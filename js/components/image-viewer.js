import { sanitizeUrl } from "../utils/validators.js";
import { activateFocusTrap } from "../utils/focus-trap.js";

let deactivateFocusTrap = null;

function closeImageViewer(viewer) {
    viewer.classList.remove("show");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("image-viewer-open");

    deactivateFocusTrap?.();
    deactivateFocusTrap = null;
}

function createImageViewer() {
    const viewer = document.createElement("div");
    viewer.id = "imageViewer";
    viewer.className = "image-viewer";
    viewer.setAttribute("aria-hidden", "true");

    viewer.innerHTML = `
        <div
            class="image-viewer-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview">
            <button
                class="image-viewer-close"
                type="button"
                aria-label="Close image preview">
                &#10005;
            </button>

            <img
                class="image-viewer-image"
                alt="">
        </div>
    `;

    viewer.addEventListener("click", (event) => {
        if (
            event.target === viewer ||
            event.target.classList.contains("image-viewer-backdrop")
        ) {
            closeImageViewer(viewer);
        }
    });

    viewer
        .querySelector(".image-viewer-close")
        .addEventListener("click", () => closeImageViewer(viewer));

    document.body.appendChild(viewer);
    return viewer;
}

export function openImageViewer(imageUrl, imageName = "Image") {
    const safeImageUrl = sanitizeUrl(imageUrl);

    if (safeImageUrl === "#") {
        return;
    }

    const viewer =
        document.getElementById("imageViewer") ||
        createImageViewer();

    const image = viewer.querySelector(".image-viewer-image");
    const closeButton = viewer.querySelector(".image-viewer-close");

    image.src = safeImageUrl;
    image.alt = imageName || "Image";
    viewer.classList.add("show");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("image-viewer-open");
    deactivateFocusTrap = activateFocusTrap(viewer, {
        initialFocus: closeButton,
        onEscape: () => closeImageViewer(viewer)
    });
}
