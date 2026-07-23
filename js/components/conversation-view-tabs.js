"use strict";

const VALID_VIEWS = new Set(["inbox", "archived"]);

export function initializeConversationViewTabs(
    container,
    { initialView = "inbox", onChange = () => {} } = {}
) {
    if (!container?.addEventListener) {
        throw new Error("Conversation view tabs are required.");
    }

    let currentView = VALID_VIEWS.has(initialView)
        ? initialView
        : "inbox";

    const updateTabs = () => {
        container.querySelectorAll("[data-conversation-view]")
            .forEach((button) => {
                const selected = button.dataset.conversationView ===
                    currentView;
                button.setAttribute("aria-selected", String(selected));
                button.tabIndex = selected ? 0 : -1;
            });
    };

    const handleClick = (event) => {
        const button = event.target.closest?.("[data-conversation-view]");
        const nextView = button?.dataset.conversationView;

        if (!VALID_VIEWS.has(nextView) || nextView === currentView) return;

        currentView = nextView;
        updateTabs();
        onChange(currentView);
    };

    container.addEventListener("click", handleClick);
    updateTabs();

    return {
        destroy() {
            container.removeEventListener("click", handleClick);
        },
        getView() {
            return currentView;
        }
    };
}
