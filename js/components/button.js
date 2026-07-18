import { escapeHtml } from "../utils/dom.js";

const VARIANTS = new Set(["primary", "secondary", "danger"]);
const SIZES = new Set(["sm", "md", "lg"]);

export function createButton({
    label,
    type = "button",
    variant = "primary",
    size = "md",
    id = "",
    disabled = false,
    className = ""
}) {
    const safeVariant = VARIANTS.has(variant) ? variant : "primary";
    const safeSize = SIZES.has(size) ? size : "md";
    const safeType = type === "submit" || type === "reset" ? type : "button";

    return `<button type="${safeType}"${id ? ` id="${escapeHtml(id)}"` : ""} class="btn btn-${safeVariant} btn-${safeSize} ${escapeHtml(className)}"${disabled ? " disabled" : ""}>${escapeHtml(label)}</button>`;
}
