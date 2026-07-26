"use strict";

import { BREAKPOINTS } from "../utils/breakpoints.js";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

function getFocusableElements(drawer) {
    return [...drawer.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
        (element) =>
            !element.hidden && element.getAttribute("aria-hidden") !== "true"
    );
}

export function createNavigationDrawer({
    drawer,
    toggleButton,
    backdrop,
    documentReference = globalThis.document,
    mobileBreakpoint = BREAKPOINTS.MOBILE
} = {}) {
    if (!drawer || !toggleButton || !backdrop) {
        throw new Error(
            "Navigation drawer requires a drawer, toggle button, and backdrop."
        );
    }

    let openState = false;
    let destroyed = false;
    const windowReference = documentReference.defaultView;
    const mobileQuery = windowReference?.matchMedia?.(
        `(max-width: ${mobileBreakpoint - 1}px) and ` + "(min-height: 521px)"
    );

    if (!drawer.id) {
        drawer.id = "navigationDrawer";
    }

    toggleButton.setAttribute("aria-controls", drawer.id);
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-haspopup", "dialog");
    backdrop.hidden = true;

    function isMobile() {
        return mobileQuery
            ? mobileQuery.matches
            : windowReference.innerWidth < mobileBreakpoint;
    }

    function updateState(nextOpen, { restoreFocus = true } = {}) {
        if (destroyed) return;

        openState = nextOpen && isMobile();
        drawer.classList.toggle("is-open", openState);
        drawer.setAttribute("aria-hidden", String(isMobile() && !openState));
        toggleButton.setAttribute("aria-expanded", String(openState));
        backdrop.hidden = !openState;
        documentReference.body.classList.toggle(
            "navigation-drawer-open",
            openState
        );

        if (openState) {
            drawer.setAttribute("role", "dialog");
            drawer.setAttribute("aria-modal", "true");
            toggleButton.setAttribute("aria-label", "Close navigation");
            getFocusableElements(drawer)[0]?.focus();
        } else {
            drawer.removeAttribute("role");
            drawer.removeAttribute("aria-modal");
            toggleButton.setAttribute("aria-label", "Open navigation");

            if (restoreFocus) {
                toggleButton.focus();
            }
        }
    }

    function open() {
        if (!isMobile()) return;
        updateState(true);
    }

    function close(options) {
        updateState(false, options);
    }

    function toggle() {
        if (openState) {
            close();
        } else {
            open();
        }
    }

    function handleKeydown(event) {
        if (!openState) return;

        if (event.key === "Escape") {
            event.preventDefault();
            close();
            return;
        }

        if (event.key !== "Tab") return;

        const focusableElements = getFocusableElements(drawer);

        if (!focusableElements.length) {
            event.preventDefault();
            drawer.focus();
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = documentReference.activeElement;

        if (!drawer.contains(activeElement)) {
            event.preventDefault();
            (event.shiftKey ? lastElement : firstElement).focus();
            return;
        }

        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    function handleViewportChange() {
        if (!isMobile()) {
            close({ restoreFocus: false });
            drawer.removeAttribute("aria-hidden");
            drawer.removeAttribute("role");
            drawer.removeAttribute("aria-modal");
        } else if (!openState) {
            drawer.setAttribute("aria-hidden", "true");
        }
    }

    toggleButton.addEventListener("click", toggle);
    backdrop.addEventListener("click", close);
    documentReference.addEventListener("keydown", handleKeydown);
    mobileQuery?.addEventListener?.("change", handleViewportChange);
    handleViewportChange();

    return {
        open,
        close,
        toggle,
        isOpen() {
            return openState;
        },
        destroy() {
            if (destroyed) return;

            close({ restoreFocus: false });
            destroyed = true;
            toggleButton.removeEventListener("click", toggle);
            backdrop.removeEventListener("click", close);
            documentReference.removeEventListener("keydown", handleKeydown);
            mobileQuery?.removeEventListener?.("change", handleViewportChange);
            drawer.classList.remove("is-open");
            drawer.removeAttribute("aria-hidden");
            toggleButton.removeAttribute("aria-controls");
            toggleButton.removeAttribute("aria-expanded");
            toggleButton.removeAttribute("aria-haspopup");
            backdrop.hidden = true;
            documentReference.body.classList.remove("navigation-drawer-open");
        }
    };
}

export function initializeNavigationDrawers(
    documentReference = globalThis.document
) {
    return [...documentReference.querySelectorAll("[data-navigation-drawer]")]
        .map((drawer) => {
            const drawerId = drawer.id;
            const toggleButton = documentReference.querySelector(
                `[data-navigation-drawer-toggle="${drawerId}"]`
            );
            const backdrop = documentReference.querySelector(
                `[data-navigation-drawer-backdrop="${drawerId}"]`
            );

            if (!toggleButton || !backdrop) {
                return null;
            }

            return createNavigationDrawer({
                drawer,
                toggleButton,
                backdrop,
                documentReference
            });
        })
        .filter(Boolean);
}
