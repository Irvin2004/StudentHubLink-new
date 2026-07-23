"use strict";

import { createEmptyState } from "../components/empty-state.js";

const actionCleanups = new WeakMap();

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new TypeError("Empty state container is required.");
    }

    return container;
}

function clearActionListener(container) {
    actionCleanups.get(container)?.();
    actionCleanups.delete(container);
}

/**
 * Renders an empty state and binds its optional action.
 *
 * @param {object} options
 * @returns {Element|null}
 */
export function showEmptyState({
    container,
    type,
    title,
    description,
    action
}) {
    const target = requireContainer(container);

    clearActionListener(target);
    target.setAttribute?.("aria-busy", "false");
    target.innerHTML = createEmptyState({
        type,
        title,
        description,
        action
    });

    const root = target.querySelector?.("[data-empty-state-root]") || null;
    const actionButton = root?.querySelector?.(
        "[data-empty-state-action]"
    );

    if (actionButton && typeof action?.onClick === "function") {
        const handleClick = (event) => {
            action.onClick(event);
        };

        actionButton.addEventListener("click", handleClick);
        actionCleanups.set(target, () => {
            actionButton.removeEventListener("click", handleClick);
        });
    }

    return root;
}

/**
 * Removes an empty state and its action listener.
 *
 * @param {Element} container
 * @returns {void}
 */
export function hideEmptyState(container) {
    const target = requireContainer(container);

    clearActionListener(target);
    target.querySelector?.("[data-empty-state-root]")?.remove();
}
