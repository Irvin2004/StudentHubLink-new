import { RESOURCE_ACTION, getResourceAction } from "../utils/constants.js";
import { createFavoriteButton } from "./favorite-button.js";
import { createRatingStars } from "./rating-stars.js";
import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format-date.js";
import { formatPrice } from "../utils/format-price.js";
import { formatFileSize } from "../utils/format-file-size.js";
import { sanitizeUrl } from "../utils/validators.js";
import { getResourceCategoryLabel } from "../config/resource-categories.js";

function createResourceActions(resource, mode) {
    const resourceId = encodeURIComponent(
        resource.id || resource.resourceId || ""
    );

    if (mode === "marketplace") {
        const primaryAction =
            getResourceAction(resource) === RESOURCE_ACTION.PURCHASE
                ? "Preview"
                : "Download";

        return `
            <div class="resource-actions">
                <a class="secondary-btn" href="resource-details.html?id=${resourceId}">
                    View Details
                </a>
                <button class="btn-secondary" type="button" data-preview-id="${escapeHtml(resource.id)}">
                    Preview
                </button>
                <button class="btn-primary" type="button" data-preview-id="${escapeHtml(resource.id)}">
                    ${escapeHtml(primaryAction)}
                </button>
            </div>
        `;
    }

    if (mode === "library") {
        const fileUrl = sanitizeUrl(
            resource.fileUrl || resource.downloadUrl || ""
        );

        const hasFileUrl = fileUrl !== "#";

        const openAction = hasFileUrl
            ? `<a class="btn-secondary" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener">
            Open
        </a>`
            : `<button class="btn-secondary" type="button">
            Open
        </button>`;

        const downloadAgainAction = hasFileUrl
            ? `<a class="btn-primary" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener">
            Download Again
        </a>`
            : `<button class="btn-primary" type="button">
            Download Again
        </button>`;

        return `
            <div class="resource-actions">
                ${openAction}
                ${downloadAgainAction}
            </div>
        `;
    }

    if (mode === "details") {
        return `
            <div class="resource-actions">
                <a class="primary-btn" href="resource-details.html?id=${resourceId}">
                    View Details
                </a>
            </div>
        `;
    }

    return "";
}

function getGroupFileIcon(type = "") {
    if (type.startsWith("image/")) return "🖼️";
    if (type === "application/pdf") return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("zip")) return "🗜️";
    return "📁";
}

function createGroupLibraryCard(resource) {
    const resourceId = escapeHtml(resource.id || "");
    const category = getResourceCategoryLabel(resource.category);

    return `
        <article class="resource-card group-library-resource-card">
            <div class="resource-icon" aria-hidden="true">
                ${getGroupFileIcon(resource.mimeType)}
            </div>

            <div class="resource-details">
                <h3>${escapeHtml(resource.title || "Untitled Resource")}</h3>
                <p>${escapeHtml(category)}</p>
                <small>
                    ${escapeHtml(formatFileSize(resource.fileSize))}
                    &bull;
                    ${escapeHtml(resource.uploaderName || "Student")}
                </small>
            </div>

            <div class="resource-actions">
                <button
                    class="btn btn-secondary preview-resource"
                    type="button"
                    data-id="${resourceId}">
                    Preview
                </button>
                <button
                    class="btn btn-primary download-resource"
                    type="button"
                    data-id="${resourceId}">
                    Download
                </button>
            </div>
        </article>
    `;
}
export function createResourceCard(resource, options = {}) {
    if (options.variant === "group-library") {
        return createGroupLibraryCard(resource);
    }

    const {
        actions = "details",
        isFavorite = false,
        showDate = true,
        showDetails = actions === "details",
        showDownloadCount = false,
        showFavorite = actions === "marketplace" || isFavorite,
        showMeta = actions === "marketplace",
        showOwner = true,
        showPrice = true,
        showPriceBadge = actions === "marketplace",
        statusLabel = ""
    } = options;

    const ownerName = resource.ownerName || "Unknown Author";

    const ownerId = encodeURIComponent(resource.ownerId || "");

    const ownerMarkup = showOwner
        ? `<p class="resource-owner">
        Uploaded by
        <a href="user-profile.html?id=${ownerId}">
            ${escapeHtml(ownerName)}
        </a>
    </p>`
        : "";

    const dateMarkup = showDate
        ? `<p class="resource-date">
        Uploaded: ${escapeHtml(formatDate(resource.createdAt))}
    </p>`
        : "";

    const priceMarkup =
        showPrice && showPriceBadge
            ? `<span class="price-badge">
        ${escapeHtml(formatPrice(resource.price || 0))}
    </span>`
            : "";

    const favoriteMarkup = showFavorite
        ? createFavoriteButton(
              resource.id || resource.resourceId || "",
              isFavorite
          )
        : "";

    const statusMarkup = statusLabel
        ? `<p class="library-date">
        ${escapeHtml(statusLabel)}
    </p>`
        : "";

    const downloadMarkup = showDownloadCount
        ? `<span>
        ${Number(resource.downloadCount || 0)} downloads
    </span>`
        : "";

    const metaMarkup =
        showMeta || showPrice || showDownloadCount
            ? `<div class="resource-meta">
        ${showPrice && !showPriceBadge ? `<span>${escapeHtml(formatPrice(resource.price || 0))}</span>` : ""}
        ${downloadMarkup}
    </div>`
            : "";

    const actionMarkup =
        showDetails || actions !== "details"
            ? createResourceActions(resource, actions)
            : "";

    return `
        <article class="resource-card">
            <div class="resource-body">
                <div class="resource-card-top">
                    <span class="resource-icon" aria-hidden="true">&#128196;</span>
                    ${priceMarkup}
                    ${favoriteMarkup}
                </div>

                <h3>${escapeHtml(resource.title || "Untitled Resource")}</h3>

                ${createRatingStars(
                    resource.averageRating || 0,
                    resource.reviewCount || 0
                )}

                <p class="resource-category">
                    ${escapeHtml(resource.category || "General")}
                </p>

                <p>
                    ${escapeHtml(resource.description || "No description available.")}
                </p>

                ${statusMarkup}
                ${ownerMarkup}
                ${dateMarkup}
                ${metaMarkup}
                ${actionMarkup}
            </div>
        </article>
    `;
}
