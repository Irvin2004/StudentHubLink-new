import { escapeHtml } from "../utils/dom.js";

let activeDialog = null;

export function openLeaveGroupDialog(groupName) {
    activeDialog?.remove();

    const previousFocus = document.activeElement;
    const dialog = document.createElement("div");

    activeDialog = dialog;
    dialog.className = "modal-overlay leave-group-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute(
        "aria-labelledby",
        "leaveGroupDialogTitle"
    );

    dialog.innerHTML = `
        <form class="modal-card leave-group-card">
            <div class="modal-header">
                <h2 id="leaveGroupDialogTitle">
                    Leave "${escapeHtml(groupName)}"?
                </h2>
            </div>

            <p>
                You will stop receiving messages and updates
                from this group.
            </p>

            <div class="modal-actions">
                <button
                    class="btn btn-secondary"
                    type="button"
                    data-leave-cancel>
                    Cancel
                </button>

                <button
                    class="btn-danger"
                    type="submit">
                    Leave Group
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);

    return new Promise((resolve) => {
        let finished = false;

        const finish = (confirmed) => {
            if (finished) {
                return;
            }

            finished = true;
            document.removeEventListener(
                "keydown",
                onKeydown
            );
            dialog.remove();
            activeDialog = null;

            if (previousFocus instanceof HTMLElement) {
                previousFocus.focus();
            }

            resolve(confirmed);
        };

        const onKeydown = (event) => {
            if (event.key === "Escape") {
                finish(false);
            }
        };

        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) {
                finish(false);
            }
        });

        dialog
            .querySelector("[data-leave-cancel]")
            ?.addEventListener(
                "click",
                () => finish(false)
            );

        dialog
            .querySelector("form")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();
                finish(true);
            });

        document.addEventListener("keydown", onKeydown);

        dialog
            .querySelector("[data-leave-cancel]")
            ?.focus();
    });
}