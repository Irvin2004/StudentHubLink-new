import { escapeHtml } from "../utils/dom.js";
import { scheduleFrame } from "../utils/raf.js";

const modalState = new WeakMap();

const FOCUSABLE_SELECTOR = [
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

function getModal(modalOrId) {
    if (modalOrId instanceof HTMLElement) {
        return modalOrId;
    }

    return document.getElementById(modalOrId);
}

function getFocusableElements(modal) {
    return Array.from(
        modal.querySelectorAll(FOCUSABLE_SELECTOR)
    ).filter((element) => !element.hidden);
}

export function createModal({
    id,
    title,
    body = "",
    actions = "",
    labelledBy = `${id}Title`
}) {
    return `
        <div
            id="${escapeHtml(id)}"
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="${escapeHtml(labelledBy)}"
            hidden>

            <div class="modal-content" data-modal-content>
                <header class="modal-header">
                    <h2 id="${escapeHtml(labelledBy)}">
                        ${escapeHtml(title)}
                    </h2>

                    <button
                        type="button"
                        class="modal-close"
                        data-modal-close
                        aria-label="Close dialog">
                        ×
                    </button>
                </header>

                <div class="modal-body">
                    ${body}
                </div>

                ${
                    actions
                        ? `
                            <footer class="modal-actions">
                                ${actions}
                            </footer>
                        `
                        : ""
                }
            </div>
        </div>
    `;
}

export function openModal(modalOrId) {
    const modal = getModal(modalOrId);

    if (!modal) {
        throw new Error("Modal element could not be found.");
    }

    if (!modal.hidden) {
        return;
    }

    const previouslyFocusedElement =
        document.activeElement;

    function close() {
        closeModal(modal);
    }

    function handleClick(event) {
        const clickedCloseButton =
            event.target.closest("[data-modal-close]");

        const clickedBackdrop =
            event.target === modal;

        if (clickedCloseButton || clickedBackdrop) {
            close();
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            close();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusableElements =
            getFocusableElements(modal);

        if (!focusableElements.length) {
            event.preventDefault();
            return;
        }

        const firstElement =
            focusableElements[0];

        const lastElement =
            focusableElements[
                focusableElements.length - 1
            ];

        if (
            event.shiftKey &&
            document.activeElement === firstElement
        ) {
            event.preventDefault();
            lastElement.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === lastElement
        ) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    const state = {
        previouslyFocusedElement,
        handleClick,
        handleKeydown,
        cancelFocus: null
    };

    modalState.set(modal, state);

    modal.addEventListener("click", handleClick);
    document.addEventListener(
        "keydown",
        handleKeydown
    );

    modal.hidden = false;
    document.body.classList.add("modal-open");

    state.cancelFocus = scheduleFrame(() => {
        const firstFocusable =
            getFocusableElements(modal)[0];

        firstFocusable?.focus();
    });
}

export function closeModal(modalOrId) {
    const modal = getModal(modalOrId);

    if (!modal || modal.hidden) {
        return;
    }

    const state = modalState.get(modal);

    if (state) {
        state.cancelFocus?.();

        modal.removeEventListener(
            "click",
            state.handleClick
        );

        document.removeEventListener(
            "keydown",
            state.handleKeydown
        );
    }

    modal.hidden = true;
    document.body.classList.remove("modal-open");

    state?.previouslyFocusedElement?.focus?.();

    modalState.delete(modal);
    modal.dispatchEvent(new CustomEvent("modal:closed"));
}
