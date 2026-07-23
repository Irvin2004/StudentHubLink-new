"use strict";

import { REACTION_TYPES, isValidReaction } from "../config/reaction-types.js";

const REACTIONS = Object.freeze([
    {
        value: REACTION_TYPES.LIKE,
        label: "React with thumbs up"
    },
    {
        value: REACTION_TYPES.LOVE,
        label: "React with heart"
    },
    {
        value: REACTION_TYPES.LAUGH,
        label: "React with laughter"
    },
    {
        value: REACTION_TYPES.WOW,
        label: "React with surprise"
    },
    {
        value: REACTION_TYPES.CELEBRATE,
        label: "React with celebration"
    }
]);

const VIEWPORT_INSET = 8;
const PICKER_GAP = 8;

let picker = null;
let anchor = null;
let selectedIndex = 0;
let currentReaction = "";
let selectCallback = () => {};
let closeCallback = () => {};

function getButtons() {
    return Array.from(picker?.querySelectorAll(".reaction-option") || []);
}

function updateSelection(nextIndex, focusButton = false) {
    const buttons = getButtons();

    if (!buttons.length) return;

    selectedIndex = (nextIndex + buttons.length) % buttons.length;

    buttons.forEach((button, index) => {
        const isKeyboardSelected = index === selectedIndex;
        button.tabIndex = isKeyboardSelected ? 0 : -1;
        button.classList.toggle(
            "selected",
            button.dataset.reaction === currentReaction
        );
        button.setAttribute(
            "aria-pressed",
            String(button.dataset.reaction === currentReaction)
        );
    });

    if (focusButton) {
        buttons[selectedIndex].focus();
    }
}

function positionPicker() {
    if (!picker?.isConnected || !anchor?.getBoundingClientRect) {
        return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const availableAbove = anchorRect.top - PICKER_GAP;
    const showAbove = availableAbove >= pickerRect.height;
    const desiredTop = showAbove
        ? anchorRect.top - pickerRect.height - PICKER_GAP
        : anchorRect.bottom + PICKER_GAP;
    const maxLeft = Math.max(
        VIEWPORT_INSET,
        window.innerWidth - pickerRect.width - VIEWPORT_INSET
    );
    const left = Math.min(
        Math.max(
            anchorRect.left + (anchorRect.width - pickerRect.width) / 2,
            VIEWPORT_INSET
        ),
        maxLeft
    );
    const maxTop = Math.max(
        VIEWPORT_INSET,
        window.innerHeight - pickerRect.height - VIEWPORT_INSET
    );

    picker.style.left = `${Math.round(left)}px`;
    picker.style.top = `${Math.round(
        Math.min(Math.max(desiredTop, VIEWPORT_INSET), maxTop)
    )}px`;
    picker.dataset.placement = showAbove ? "top" : "bottom";
}

function selectReaction(reaction) {
    if (!isValidReaction(reaction)) return;

    try {
        selectCallback(reaction);
    } finally {
        closeReactionPicker();
    }
}

function handlePickerClick(event) {
    const button = event.target.closest?.("[data-reaction]");

    if (!button || !picker?.contains(button)) return;

    selectReaction(button.dataset.reaction);
}

function handlePickerKeydown(event) {
    if (!picker) return;

    switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
            event.preventDefault();
            updateSelection(selectedIndex - 1, true);
            break;
        case "ArrowRight":
        case "ArrowDown":
            event.preventDefault();
            updateSelection(selectedIndex + 1, true);
            break;
        case "Home":
            event.preventDefault();
            updateSelection(0, true);
            break;
        case "End":
            event.preventDefault();
            updateSelection(REACTIONS.length - 1, true);
            break;
        case "Enter":
        case " ":
            event.preventDefault();
            selectReaction(REACTIONS[selectedIndex].value);
            break;
        case "Escape":
            event.preventDefault();
            {
                const previousAnchor = anchor;
                closeReactionPicker();
                previousAnchor?.focus?.();
            }
            break;
        case "Tab":
            event.preventDefault();
            updateSelection(selectedIndex + (event.shiftKey ? -1 : 1), true);
            break;
    }
}

function handleOutsideClick(event) {
    if (picker?.contains(event.target) || anchor?.contains?.(event.target)) {
        return;
    }

    closeReactionPicker();
}

function handleViewportChange() {
    positionPicker();
}

function addOpenListeners() {
    document.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
}

function removeOpenListeners() {
    document.removeEventListener("pointerdown", handleOutsideClick);
    window.removeEventListener("resize", handleViewportChange);
    window.removeEventListener("scroll", handleViewportChange, true);
}

export function createReactionPicker(options = {}) {
    destroyReactionPicker();

    currentReaction = isValidReaction(options.currentReaction)
        ? options.currentReaction
        : "";
    selectCallback =
        typeof options.onSelect === "function" ? options.onSelect : () => {};
    closeCallback =
        typeof options.onClose === "function" ? options.onClose : () => {};
    selectedIndex = Math.max(
        0,
        REACTIONS.findIndex(({ value }) => value === currentReaction)
    );

    picker = document.createElement("div");
    picker.className = "reaction-picker";
    picker.setAttribute("role", "toolbar");
    picker.setAttribute("aria-label", "Choose a reaction");
    picker.setAttribute("aria-orientation", "horizontal");
    picker.innerHTML = REACTIONS.map(
        ({ value, label }, index) => `
        <button
            class="reaction-option${
                value === currentReaction ? " selected" : ""
            }"
            type="button"
            data-reaction="${value}"
            data-emoji="${value}"
            aria-label="${label}"
            aria-pressed="${value === currentReaction}"
            tabindex="${index === selectedIndex ? "0" : "-1"}"
        >${value}</button>
    `
    ).join("");

    picker.addEventListener("click", handlePickerClick);
    picker.addEventListener("keydown", handlePickerKeydown);

    return picker;
}

export function openReactionPicker(anchorElement) {
    if (!anchorElement?.getBoundingClientRect) {
        throw new Error("Reaction picker anchor is required.");
    }

    if (!picker) {
        createReactionPicker();
    }

    anchor = anchorElement;

    if (!picker.isConnected) {
        document.body.appendChild(picker);
    }

    picker.classList.add("open");
    positionPicker();
    updateSelection(selectedIndex, true);
    addOpenListeners();

    return picker;
}

export function closeReactionPicker() {
    if (!picker) return;

    const wasOpen = picker.isConnected;

    removeOpenListeners();
    picker.classList.remove("open");
    picker.remove();
    anchor = null;

    if (wasOpen) {
        closeCallback();
    }
}

export function toggleReactionPicker(anchorElement) {
    if (picker?.isConnected && anchor === anchorElement) {
        closeReactionPicker();
        return null;
    }

    return openReactionPicker(anchorElement);
}

export function destroyReactionPicker() {
    if (!picker) return;

    closeReactionPicker();
    picker.removeEventListener("click", handlePickerClick);
    picker.removeEventListener("keydown", handlePickerKeydown);
    picker = null;
    anchor = null;
    selectedIndex = 0;
    currentReaction = "";
    selectCallback = () => {};
    closeCallback = () => {};
}
