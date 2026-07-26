const FOCUSABLE_SELECTOR = [
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hidden
    );
}

export function activateFocusTrap(container, { initialFocus, onEscape } = {}) {
    const previousFocus = document.activeElement;
    const activeRoot = Array.from(document.body.children).find(
        (element) => element === container || element.contains(container)
    );
    const siblingStates = Array.from(document.body.children)
        .filter((element) => element !== activeRoot)
        .map((element) => ({ element, inert: element.inert }));

    siblingStates.forEach(({ element }) => {
        element.inert = true;
    });

    const handleKeydown = (event) => {
        if (event.key === "Escape" && typeof onEscape === "function") {
            event.preventDefault();
            onEscape();
            return;
        }

        if (event.key !== "Tab") return;
        const focusable = getFocusableElements(container);

        if (!focusable.length) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    document.addEventListener("keydown", handleKeydown);
    (initialFocus || getFocusableElements(container)[0])?.focus();

    return () => {
        document.removeEventListener("keydown", handleKeydown);
        siblingStates.forEach(({ element, inert }) => {
            element.inert = inert;
        });
        previousFocus?.focus?.();
    };
}
