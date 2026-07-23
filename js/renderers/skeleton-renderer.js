"use strict";

import {
    createSkeleton,
    SKELETON_TYPES
} from "../components/skeleton.js";

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

export function showSkeleton(container, type, options = {}) {
    const target = requireContainer(container);
    const normalizedType = String(type || "").toUpperCase();
    const count = getResponsiveCount(
        target,
        normalizedType,
        options.count
    );

    target.setAttribute("aria-busy", "true");
    target.innerHTML = createSkeleton(
        normalizedType,
        count === undefined ? {} : { count }
    );
    activeContainers.add(target);

    return target.querySelector?.("[data-skeleton-root]") || null;
}

export function hideSkeleton(container) {
    const target = requireContainer(container);

    target.querySelector?.("[data-skeleton-root]")?.remove();
    target.setAttribute("aria-busy", "false");
    activeContainers.delete(target);
}

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
