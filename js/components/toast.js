import { escapeHtml } from "../utils/dom.js";
import { showToast } from "../utils/toast.js";

export { showToast };

export function createToast(message, type = "success") {
    const safeType = ["success", "warning", "error", "info"].includes(type) ? type : "info";
    return `<div class="toast ${safeType}" role="status">${escapeHtml(message)}</div>`;
}
