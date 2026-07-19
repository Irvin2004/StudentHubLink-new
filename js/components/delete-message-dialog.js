let activeDialog = null;

export function openDeleteMessageDialog({
    canDeleteForEveryone = false
} = {}) {
    activeDialog?.remove();

    const previousFocus = document.activeElement;
    const dialog = document.createElement("div");

    activeDialog = dialog;
    dialog.className = "modal-overlay delete-message-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute(
        "aria-labelledby",
        "deleteMessageDialogTitle"
    );

    dialog.innerHTML = `
        <form class="modal-card delete-message-card">
            <div class="modal-header">
                <h2 id="deleteMessageDialogTitle">
                    Delete Message
                </h2>
            </div>

            ${canDeleteForEveryone
                ? `
                    <fieldset class="delete-message-options">
                        <legend class="sr-only">
                            Choose how to delete this message
                        </legend>

                        <label>
                            <input
                                type="radio"
                                name="deleteScope"
                                value="me"
                                checked>
                            <span>
                                <strong>Delete for me</strong>
                                <small>
                                    Other participants will still see it.
                                </small>
                            </span>
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="deleteScope"
                                value="everyone">
                            <span>
                                <strong>Delete for everyone</strong>
                                <small>
                                    Replaces the message with a deleted notice.
                                </small>
                            </span>
                        </label>
                    </fieldset>
                `
                : `
                    <p>
                        Delete for me only?
                    </p>
                `
            }

            <div class="modal-actions">
                <button
                    class="btn btn-secondary"
                    type="button"
                    data-delete-cancel>
                    Cancel
                </button>

                <button
                    class="btn-danger"
                    type="submit">
                    Delete
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);

    return new Promise((resolve) => {
        const finish = (choice) => {
            document.removeEventListener("keydown", onKeydown);
            dialog.remove();
            activeDialog = null;

            if (previousFocus instanceof HTMLElement) {
                previousFocus.focus();
            }

            resolve(choice);
        };

        const onKeydown = (event) => {
            if (event.key === "Escape") {
                finish(null);
            }
        };

        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) {
                finish(null);
            }
        });

        dialog
            .querySelector("[data-delete-cancel]")
            ?.addEventListener("click", () => finish(null));

        dialog
            .querySelector("form")
            ?.addEventListener("submit", (event) => {
                event.preventDefault();

                const selectedScope = dialog.querySelector(
                    'input[name="deleteScope"]:checked'
                );

                finish(selectedScope?.value || "me");
            });

        document.addEventListener("keydown", onKeydown);

        (
            dialog.querySelector(
                'input[name="deleteScope"]:checked'
            ) ||
            dialog.querySelector("[data-delete-cancel]")
        )?.focus();
    });
}
