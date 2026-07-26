import { createModal, closeModal, openModal } from "./modal.js";
import { escapeHtml } from "../utils/dom.js";

let activeDialog = null;

export function openConfirmationDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false
}) {
    if (activeDialog) {
        closeModal(activeDialog);
    }

    document.body.insertAdjacentHTML(
        "beforeend",
        createModal({
            id: "confirmationDialog",
            title,
            body: `<p>${escapeHtml(message)}</p>`,
            actions: `
                <button
                    class="btn btn-secondary"
                    type="button"
                    data-modal-close>
                    ${escapeHtml(cancelLabel)}
                </button>

                <button
                    class="${danger ? "btn-danger" : "btn btn-primary"}"
                    type="button"
                    data-confirm-dialog>
                    ${escapeHtml(confirmLabel)}
                </button>
            `
        })
    );

    const dialog = document.getElementById("confirmationDialog");
    activeDialog = dialog;

    return new Promise((resolve) => {
        let confirmed = false;

        dialog
            .querySelector("[data-confirm-dialog]")
            ?.addEventListener("click", () => {
                confirmed = true;
                closeModal(dialog);
            });

        dialog.addEventListener(
            "modal:closed",
            () => {
                dialog.remove();

                if (activeDialog === dialog) {
                    activeDialog = null;
                }

                resolve(confirmed);
            },
            { once: true }
        );

        openModal(dialog);
    });
}
