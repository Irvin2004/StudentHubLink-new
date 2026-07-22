const panelStates = new WeakMap();
let panelId = 0;

function getPanelState(panelContainer) {
    const state = panelStates.get(panelContainer);

    if (!state) {
        throw new Error("Notification panel has not been created.");
    }

    return state;
}

function renderLoadingState() {
    return `
        <div class="notification-panel-loading" aria-label="Loading notifications">
            <span class="notification-panel-skeleton"></span>
            <span class="notification-panel-skeleton"></span>
            <span class="notification-panel-skeleton"></span>
        </div>
    `;
}

function renderPanelStructure() {
    return `
        <header class="notification-panel-header">
            <h2>Notifications</h2>
        </header>

        <div
            class="notification-panel-list"
            data-notification-list
            aria-live="polite"
            aria-busy="true"
        >
            ${renderLoadingState()}
        </div>

        <footer class="notification-panel-footer">
            <button
                class="notification-panel-mark-all"
                type="button"
                data-notification-mark-all
                disabled
            >
                Mark all as read
            </button>
        </footer>
    `;
}

function ensureBadge(bellButton) {
    let badge = bellButton.querySelector(
        "[data-notification-badge], #notificationCount"
    );

    if (!badge) {
        badge = bellButton.ownerDocument.createElement("span");
        bellButton.append(badge);
    }

    badge.classList.add("notification-badge");
    badge.dataset.notificationBadge = "";
    badge.hidden = true;
    badge.textContent = "0";

    return badge;
}

export function createNotificationPanel({
    bellButton,
    panelContainer
} = {}) {
    if (!bellButton) {
        throw new Error("Notification bell button is required.");
    }

    if (!panelContainer) {
        throw new Error("Notification panel container is required.");
    }

    panelStates.get(panelContainer)?.destroy();

    const ownerDocument = panelContainer.ownerDocument;
    const anchor = bellButton.parentElement;
    const anchorAlreadyPositioned = anchor?.classList.contains(
        "notification-panel-anchor"
    );
    const bellAlreadyPositioned = bellButton.classList.contains(
        "notification-bell-button"
    );

    if (!panelContainer.id) {
        panelId += 1;
        panelContainer.id = `notificationPanel${panelId}`;
    }

    anchor?.classList.add("notification-panel-anchor");
    bellButton.classList.add("notification-bell-button");
    panelContainer.classList.add("notification-panel");
    panelContainer.setAttribute("role", "region");
    panelContainer.setAttribute("aria-label", "Notifications");
    panelContainer.hidden = true;
    panelContainer.innerHTML = renderPanelStructure();

    bellButton.setAttribute("aria-controls", panelContainer.id);
    bellButton.setAttribute("aria-expanded", "false");
    bellButton.setAttribute("aria-haspopup", "true");

    const list = panelContainer.querySelector(
        "[data-notification-list]"
    );
    const markAllButton = panelContainer.querySelector(
        "[data-notification-mark-all]"
    );
    const badge = ensureBadge(bellButton);

    const handleBellClick = (event) => {
        event.stopPropagation();
        toggleNotificationPanel(panelContainer);
    };

    const handleOutsideClick = (event) => {
        if (
            !panelContainer.hidden &&
            !panelContainer.contains(event.target) &&
            !bellButton.contains(event.target)
        ) {
            closeNotificationPanel(panelContainer);
        }
    };

    const handleKeydown = (event) => {
        if (event.key === "Escape" && !panelContainer.hidden) {
            closeNotificationPanel(panelContainer);
            bellButton.focus();
        }
    };

    bellButton.addEventListener("click", handleBellClick);
    ownerDocument.addEventListener("click", handleOutsideClick);
    ownerDocument.addEventListener("keydown", handleKeydown);

    const state = {
        bellButton,
        panelContainer,
        list,
        markAllButton,
        badge,
        setLoading() {
            list.setAttribute("aria-busy", "true");
            list.innerHTML = renderLoadingState();
        },
        showError(message) {
            list.setAttribute("aria-busy", "false");
            list.innerHTML = "";

            const errorMessage = ownerDocument.createElement("p");
            errorMessage.className = "notification-panel-error";
            errorMessage.textContent = message;
            list.append(errorMessage);
        },
        destroy() {
            closeNotificationPanel(panelContainer);
            bellButton.removeEventListener("click", handleBellClick);
            ownerDocument.removeEventListener("click", handleOutsideClick);
            ownerDocument.removeEventListener("keydown", handleKeydown);

            if (!anchorAlreadyPositioned) {
                anchor?.classList.remove("notification-panel-anchor");
            }

            if (!bellAlreadyPositioned) {
                bellButton.classList.remove("notification-bell-button");
            }

            panelStates.delete(panelContainer);
        }
    };

    panelStates.set(panelContainer, state);
    return state;
}

export function openNotificationPanel(panelContainer) {
    const { bellButton } = getPanelState(panelContainer);

    panelContainer.hidden = false;
    panelContainer.classList.add("is-open");
    bellButton.setAttribute("aria-expanded", "true");
}

export function closeNotificationPanel(panelContainer) {
    const { bellButton } = getPanelState(panelContainer);

    panelContainer.hidden = true;
    panelContainer.classList.remove("is-open");
    bellButton.setAttribute("aria-expanded", "false");
}

export function toggleNotificationPanel(panelContainer) {
    if (panelContainer.hidden) {
        openNotificationPanel(panelContainer);
        return;
    }

    closeNotificationPanel(panelContainer);
}
