const EMOJIS = [
    "👍",
    "❤️",
    "😂",
    "🎉",
    "😮",
    "😢"
];

export function createReactionPicker() {
    const picker = document.createElement("div");

    picker.className = "reaction-picker";
    picker.setAttribute("role", "menu");
    picker.setAttribute("aria-label", "Choose a reaction");

    picker.innerHTML = EMOJIS.map((emoji) => `
        <button
            class="reaction-option"
            type="button"
            role="menuitem"
            data-emoji="${emoji}"
            aria-label="React with ${emoji}">
            ${emoji}
        </button>
    `).join("");

    return picker;
}
