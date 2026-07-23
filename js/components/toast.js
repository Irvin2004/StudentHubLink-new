"use strict";

import { ERROR_TYPES } from "../config/error-types.js";

const DEFAULT_DURATIONS = Object.freeze({
    [ERROR_TYPES.SUCCESS]: 3000,
    [ERROR_TYPES.INFO]: 4000,
    [ERROR_TYPES.WARNING]: 5000,
    [ERROR_TYPES.ERROR]: 6000
});

const ICONS = Object.freeze({
    [ERROR_TYPES.SUCCESS]: "\u2713",
    [ERROR_TYPES.INFO]: "i",
    [ERROR_TYPES.WARNING]: "!",
    [ERROR_TYPES.ERROR]: "\u00d7"
});

const toastHosts = new WeakMap();

function getToastHost(documentReference) {
    const currentHost = toastHosts.get(documentReference);

    if (currentHost?.isConnected) {
        return currentHost;
    }

    const host = documentReference.createElement("section");
    host.className = "toast-container";
    host.setAttribute("aria-label", "Notifications");
    documentReference.body.append(host);
    toastHosts.set(documentReference, host);
    return host;
}

function getSignature(notification) {
    return [notification.type, notification.title, notification.message].join(
        "\u0000"
    );
}

export function createToast(
    notification,
    documentReference = globalThis.document
) {
    if (!documentReference?.createElement) {
        return {
            ...notification,
            element: null,
            dismiss() {}
        };
    }

    const host = getToastHost(documentReference);
    const signature = getSignature(notification);
    const duplicate = [...host.children].find(
        (element) => element.dataset.toastSignature === signature
    );

    if (duplicate) {
        return {
            ...notification,
            element: duplicate,
            dismiss: () => duplicate.remove()
        };
    }

    const toast = documentReference.createElement("article");
    const icon = documentReference.createElement("span");
    const content = documentReference.createElement("div");
    const title = documentReference.createElement("strong");
    const message = documentReference.createElement("p");
    const closeButton = documentReference.createElement("button");
    const assertive =
        notification.type === ERROR_TYPES.ERROR ||
        notification.type === ERROR_TYPES.WARNING;
    const duration =
        notification.duration ??
        DEFAULT_DURATIONS[notification.type] ??
        DEFAULT_DURATIONS[ERROR_TYPES.INFO];
    let removalTimer = null;
    let removalFallbackTimer = null;

    toast.className = `toast toast--${notification.type}`;
    toast.dataset.toastId = notification.id;
    toast.dataset.toastSignature = signature;
    toast.setAttribute("role", assertive ? "alert" : "status");
    toast.setAttribute("aria-live", assertive ? "assertive" : "polite");
    toast.setAttribute("aria-atomic", "true");

    icon.className = "toast__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = ICONS[notification.type];

    content.className = "toast__content";
    title.className = "toast__title";
    title.textContent = notification.title;
    message.className = "toast__message";
    message.textContent = notification.message;
    content.append(title, message);

    closeButton.className = "toast__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", `Dismiss ${notification.title}`);
    closeButton.textContent = "\u00d7";

    function dismiss() {
        clearTimeout(removalTimer);
        clearTimeout(removalFallbackTimer);
        toast.classList.add("toast--leaving");
        toast.addEventListener("animationend", () => toast.remove(), {
            once: true
        });

        if (
            documentReference.documentElement?.dataset?.reducedMotion ===
                "true" ||
            globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ) {
            toast.remove();
            return;
        }

        removalFallbackTimer = setTimeout(() => toast.remove(), 200);
    }

    closeButton.addEventListener("click", dismiss);
    toast.append(icon, content, closeButton);
    host.append(toast);

    if (duration > 0) {
        removalTimer = setTimeout(dismiss, duration);
    }

    return {
        ...notification,
        duration,
        element: toast,
        dismiss
    };
}

export function destroyToasts(documentReference = globalThis.document) {
    const host = toastHosts.get(documentReference);
    host?.remove();
    toastHosts.delete(documentReference);
}
