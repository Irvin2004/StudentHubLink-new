"use strict";

import { createSkeleton } from "../components/skeleton.js";
import { SKELETON_TYPES } from "../config/skeleton-types.js";

const activeContainers = new Set();

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new TypeError("Skeleton container is required.");
    }

    return container;
}

function getResponsiveCount(container, type, requestedCount) {
    if (requestedCount !== undefined) {
        return requestedCount;
    }

    if (type !== SKELETON_TYPES.MESSAGE) {
        return undefined;
    }

    const view = container.ownerDocument?.defaultView;
    const mobile = view?.matchMedia?.("(max-width: 767px)").matches;

    return mobile ? 5 : 8;
}

/**
 * Replaces a container's contents with a skeleton layout.
 *
 * @param {Element} container
 * @param {string} type
 * @param {{count?: number}} options
 * @returns {Element|null}
 */
export function showSkeleton(container, type, options = {}) {
    const target = requireContainer(container);
    const normalizedType = String(type || "").toLowerCase();
    const count = getResponsiveCount(target, normalizedType, options.count);

    target.setAttribute("aria-busy", "true");
    target.innerHTML = createSkeleton(
        normalizedType,
        count === undefined ? {} : { count }
    );
    activeContainers.add(target);

    return target.querySelector?.("[data-skeleton-root]") || null;
}

/**
 * Removes a rendered skeleton and clears the busy state.
 *
 * @param {Element} container
 * @returns {void}
 */
export function hideSkeleton(container) {
    const target = requireContainer(container);

    target.querySelector?.("[data-skeleton-root]")?.remove();
    target.setAttribute("aria-busy", "false");
    activeContainers.delete(target);
}

/**
 * Destroys one skeleton or every active skeleton.
 *
 * @param {Element} [container]
 * @returns {void}
 */
export function destroySkeleton(container) {
    if (container) {
        hideSkeleton(container);
        return;
    }

    [...activeContainers].forEach((target) => {
        if (target?.isConnected !== false) {
            hideSkeleton(target);
        } else {
            activeContainers.delete(target);
        }
    });
}
