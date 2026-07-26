"use strict";

let activeContextMenu = null;
let contextMenuId = 0;

function normalizeItems(items = []) {
    return items
        .map((item) => ({
            id: String(item.id || "").trim(),
            label: String(item.label || "").trim(),
            icon: String(item.icon || "").trim(),
            danger: item.danger === true,
            disabled: item.disabled === true,
            separatorBefore: item.separatorBefore === true,
            title: String(item.title || "").trim()
        }))
        .filter((item) => item.id && item.label);
}

function positionMenu(menu, anchor, coordinates = {}) {
    const anchorRect = anchor?.getBoundingClientRect?.();
    const requestedLeft = Number.isFinite(coordinates.x)
        ? coordinates.x
        : anchorRect?.right || 0;
    const requestedTop = Number.isFinite(coordinates.y)
        ? coordinates.y
        : anchorRect?.bottom || 0;
    const margin = 8;
    const menuRect = menu.getBoundingClientRect();
    const left = Math.min(
        Math.max(margin, requestedLeft),
        Math.max(margin, window.innerWidth - menuRect.width - margin)
    );
    const top = Math.min(
        Math.max(margin, requestedTop),
        Math.max(margin, window.innerHeight - menuRect.height - margin)
    );

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
}

export function createContextMenu({
    items = [],
    anchor = null,
    onSelect = () => {},
    onClose = () => {}
} = {}) {
    destroyContextMenu();

    if (typeof onSelect !== "function") {
        throw new Error("Context menu selection handler is required.");
    }

    const normalizedItems = normalizeItems(items);
    const menu = document.createElement("div");
    let trigger = anchor;
    let isOpen = false;

    menu.className = "context-menu";
    menu.id = `context-menu-${++contextMenuId}`;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Actions");
    menu.setAttribute("aria-orientation", "vertical");
    menu.tabIndex = -1;
    menu.hidden = true;

    normalizedItems.forEach((item) => {
        if (item.separatorBefore) {
            const separator = document.createElement("div");
            separator.className = "context-menu__separator";
            separator.setAttribute("role", "separator");
            menu.appendChild(separator);
        }

        const button = document.createElement("button");
        const icon = document.createElement("span");
        const label = document.createElement("span");

        button.className = "context-menu__item";
        if (item.danger) button.classList.add("context-menu__danger");
        button.type = "button";
        button.dataset.contextMenuAction = item.id;
        button.setAttribute("role", "menuitem");
        button.disabled = item.disabled;
        if (item.title) button.title = item.title;

        icon.className = "context-menu__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = item.icon;
        label.textContent = item.label;
        button.append(icon, label);
        menu.appendChild(button);
    });

    document.body.appendChild(menu);

    const enabledItems = () => [
        ...menu.querySelectorAll(".context-menu__item:not(:disabled)")
    ];

    const close = ({ restoreFocus = true } = {}) => {
        if (!isOpen) return;
        isOpen = false;
        menu.hidden = true;
        document.removeEventListener("pointerdown", handleOutsidePointer);
        window.removeEventListener("resize", close);
        window.removeEventListener("scroll", close, true);
        trigger?.setAttribute?.("aria-expanded", "false");
        if (restoreFocus && trigger?.isConnected) trigger.focus();
        onClose();
    };

    const handleOutsidePointer = (event) => {
        if (
            !menu.contains(event.target) &&
            !trigger?.contains?.(event.target)
        ) {
            close({ restoreFocus: false });
        }
    };

    const handleKeydown = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            close();
            return;
        }

        const buttons = enabledItems();
        if (!buttons.length) return;

        const currentIndex = buttons.indexOf(document.activeElement);

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const nextIndex =
                currentIndex < 0
                    ? 0
                    : (currentIndex + direction + buttons.length) %
                      buttons.length;
            buttons[nextIndex].focus();
            return;
        }

        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            buttons[event.key === "Home" ? 0 : buttons.length - 1].focus();
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            const direction = event.shiftKey ? -1 : 1;
            const nextIndex =
                currentIndex < 0
                    ? 0
                    : (currentIndex + direction + buttons.length) %
                      buttons.length;
            buttons[nextIndex].focus();
        }
    };

    const handleClick = async (event) => {
        const button = event.target.closest("[data-context-menu-action]");
        if (!button || button.disabled) return;

        const action = button.dataset.contextMenuAction;
        close();
        await onSelect(action);
    };

    menu.addEventListener("keydown", handleKeydown);
    menu.addEventListener("click", handleClick);

    const controller = {
        open({ anchor: nextAnchor = trigger, x, y } = {}) {
            trigger = nextAnchor;
            isOpen = true;
            menu.hidden = false;
            trigger?.setAttribute?.("aria-expanded", "true");
            trigger?.setAttribute?.("aria-haspopup", "menu");
            trigger?.setAttribute?.("aria-controls", menu.id);
            positionMenu(menu, trigger, { x, y });
            document.addEventListener("pointerdown", handleOutsidePointer);
            window.addEventListener("resize", close);
            window.addEventListener("scroll", close, true);
            const firstItem = enabledItems()[0];
            (firstItem || menu).focus();
        },
        close,
        destroy() {
            close({ restoreFocus: false });
            menu.removeEventListener("keydown", handleKeydown);
            menu.removeEventListener("click", handleClick);
            menu.remove();
            if (activeContextMenu === controller) activeContextMenu = null;
        }
    };

    activeContextMenu = controller;
    return controller;
}

export function openContextMenu(options = {}) {
    activeContextMenu?.open(options);
}

export function closeContextMenu() {
    activeContextMenu?.close();
}

export function destroyContextMenu() {
    activeContextMenu?.destroy();
}

export function bindContextMenuInteractions({
    container,
    targetSelector,
    onOpen,
    longPressDuration = 550,
    movementTolerance = 10
} = {}) {
    if (!container?.addEventListener) {
        throw new Error("Context menu interaction container is required.");
    }

    if (!targetSelector || typeof onOpen !== "function") {
        throw new Error(
            "Context menu interactions require a selector and open handler."
        );
    }

    let longPressTimer = null;
    let pointerStart = null;
    let activeTarget = null;
    let suppressNextClick = false;

    const clearLongPress = () => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        pointerStart = null;
        activeTarget = null;
    };

    const getTarget = (event) =>
        event.target?.closest?.(targetSelector) || null;

    const handleContextMenu = (event) => {
        const target = getTarget(event);
        if (!target) return;

        event.preventDefault();
        onOpen({
            target,
            anchor: target,
            x: event.clientX,
            y: event.clientY,
            inputType: "mouse"
        });
    };

    const handlePointerDown = (event) => {
        if (!["touch", "pen"].includes(event.pointerType)) {
            return;
        }

        const target = getTarget(event);
        if (!target) return;

        activeTarget = target;
        pointerStart = {
            x: event.clientX,
            y: event.clientY
        };

        longPressTimer = setTimeout(() => {
            const pressedTarget = activeTarget;
            const coordinates = pointerStart;

            if (!pressedTarget || !coordinates) return;

            suppressNextClick = true;
            onOpen({
                target: pressedTarget,
                anchor: pressedTarget,
                ...coordinates,
                inputType: event.pointerType
            });
            clearLongPress();
        }, longPressDuration);
    };

    const handlePointerMove = (event) => {
        if (!pointerStart) return;

        if (
            Math.abs(event.clientX - pointerStart.x) > movementTolerance ||
            Math.abs(event.clientY - pointerStart.y) > movementTolerance
        ) {
            clearLongPress();
        }
    };

    const handleClickCapture = (event) => {
        if (!suppressNextClick) return;

        suppressNextClick = false;
        event.preventDefault();
        event.stopPropagation();
    };

    container.addEventListener("contextmenu", handleContextMenu);
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", clearLongPress);
    container.addEventListener("pointercancel", clearLongPress);
    container.addEventListener("click", handleClickCapture, true);

    return function destroyContextMenuInteractions() {
        clearLongPress();
        container.removeEventListener("contextmenu", handleContextMenu);
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerup", clearLongPress);
        container.removeEventListener("pointercancel", clearLongPress);
        container.removeEventListener("click", handleClickCapture, true);
    };
}
