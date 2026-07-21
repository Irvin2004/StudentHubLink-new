import { createModal } from "./modal.js";

const MODAL_MODES = Object.freeze({
    create: {
        title: "New Assignment",
        submitText: "Create Assignment",
        loadingText: "Creating..."
    },
    edit: {
        title: "Edit Assignment",
        submitText: "Save Changes",
        loadingText: "Saving..."
    }
});

export function createAssignmentModal() {
    return createModal({
        id: "assignmentModal",
        title: "New Assignment",
        body: `
            <form id="assignmentForm" class="assignment-form" novalidate>
                <div class="form-group">
                    <label for="assignmentTitle">Title</label>
                    <input
                        id="assignmentTitle"
                        type="text"
                        maxlength="120"
                        autocomplete="off"
                        required>
                    <small id="titleCounter">0 / 120</small>
                </div>

                <div class="form-group">
                    <label for="assignmentDescription">Description</label>
                    <textarea
                        id="assignmentDescription"
                        maxlength="2000"
                        rows="5"></textarea>
                    <small id="descriptionCounter">0 / 2000</small>
                </div>

                <div class="form-group">
                    <label for="assignmentDueDate">Due Date</label>
                    <input
                        id="assignmentDueDate"
                        type="date"
                        required>
                </div>
            </form>
        `,
        actions: `
            <button
                class="btn btn-secondary"
                type="button"
                data-modal-close>
                Cancel
            </button>

            <button
                id="createAssignmentButton"
                class="btn btn-primary"
                type="submit"
                form="assignmentForm">
                Create Assignment
            </button>
        `
    });
}

export function setAssignmentModalMode(mode) {
    const modeDetails = MODAL_MODES[mode];
    const modalTitle = document.getElementById("assignmentModalTitle");
    const submitButton = document.getElementById(
        "createAssignmentButton"
    );

    if (!modeDetails) {
        throw new Error("Choose a valid assignment modal mode.");
    }

    if (!modalTitle || !submitButton) {
        throw new Error("Assignment modal elements could not be found.");
    }

    modalTitle.textContent = modeDetails.title;
    submitButton.textContent = modeDetails.submitText;
    submitButton.dataset.defaultText = modeDetails.submitText;
    submitButton.dataset.loadingText = modeDetails.loadingText;
}
