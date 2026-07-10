import { escapeHtml } from "../utils/dom.js";

export function createModal({
    id,
    title,
    body = "",
    actions = ""
}) {
    return `
        <div class="modal" id="${escapeHtml(id)}" role="dialog" aria-modal="true">
            <div class="modal-content">
                <h2>${escapeHtml(title)}</h2>
                ${body}
                <div class="modal-actions">
                    ${actions}
                </div>
            </div>
        </div>
    `;
}
