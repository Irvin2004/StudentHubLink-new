import { escapeHtml } from "../utils/dom.js";

export function createConfirmationDialog({ id = "confirmationDialog", title = "Are you sure?", message = "This action cannot be undone.", confirmLabel = "Confirm", cancelLabel = "Cancel" } = {}) {
    return `<div class="modal" id="${escapeHtml(id)}" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(id)}Title" hidden><div class="modal-content"><div class="modal-header"><h2 id="${escapeHtml(id)}Title">${escapeHtml(title)}</h2></div><p>${escapeHtml(message)}</p><div class="modal-actions"><button type="button" class="btn btn-secondary" data-dialog-cancel>${escapeHtml(cancelLabel)}</button><button type="button" class="btn btn-danger" data-dialog-confirm>${escapeHtml(confirmLabel)}</button></div></div></div>`;
}

export function openConfirmationDialog(dialog) {
    dialog.hidden = false;
    return new Promise((resolve) => {
        const finish = (confirmed) => { dialog.hidden = true; resolve(confirmed); };
        dialog.querySelector("[data-dialog-confirm]")?.addEventListener("click", () => finish(true), { once: true });
        dialog.querySelector("[data-dialog-cancel]")?.addEventListener("click", () => finish(false), { once: true });
    });
}
