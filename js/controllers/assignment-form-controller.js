import { toDate } from "../utils/format-date.js";

const TITLE_LIMIT = 120;
const DESCRIPTION_LIMIT = 2000;

function getLocalDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getAssignmentFormFields() {
    return {
        title: document.getElementById("assignmentTitle"),
        description: document.getElementById("assignmentDescription"),
        dueDate: document.getElementById("assignmentDueDate"),
        titleCounter: document.getElementById("titleCounter"),
        descriptionCounter: document.getElementById("descriptionCounter")
    };
}

function updateCounterValues({
    title,
    description,
    titleCounter,
    descriptionCounter
}) {
    titleCounter.textContent =
        `${title.value.length} / ${TITLE_LIMIT}`;
    descriptionCounter.textContent =
        `${description.value.length} / ${DESCRIPTION_LIMIT}`;
}

export function populateAssignmentForm(assignment) {
    const fields = getAssignmentFormFields();
    const dueDate = toDate(assignment?.dueDate);

    if (
        !fields.title ||
        !fields.description ||
        !fields.dueDate ||
        !fields.titleCounter ||
        !fields.descriptionCounter
    ) {
        throw new Error("Assignment form elements could not be found.");
    }

    if (!assignment || !dueDate) {
        throw new Error("A valid assignment is required.");
    }

    fields.title.value = assignment.title || "";
    fields.description.value = assignment.description || "";
    fields.dueDate.value = getLocalDateInputValue(dueDate);
    updateCounterValues(fields);
}

export function initialiseAssignmentForm({
    onSubmit,
    onError
} = {}) {
    const form = document.getElementById("assignmentForm");
    const {
        title,
        description,
        dueDate,
        titleCounter,
        descriptionCounter
    } = getAssignmentFormFields();
    const createButton = document.getElementById("createAssignmentButton");

    if (
        !form ||
        !title ||
        !description ||
        !dueDate ||
        !titleCounter ||
        !descriptionCounter ||
        !createButton
    ) {
        throw new Error("Assignment form elements could not be found.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.min = getLocalDateInputValue(today);

    function updateCounters() {
        updateCounterValues({
            title,
            description,
            titleCounter,
            descriptionCounter
        });
    }

    function resetForm() {
        form.reset();
        title.setCustomValidity("");
        description.setCustomValidity("");
        dueDate.setCustomValidity("");
        updateCounters();
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        createButton.disabled = true;
        createButton.textContent =
            createButton.dataset.loadingText || "Creating...";

        try {
            await onSubmit?.({
                title: title.value,
                description: description.value,
                dueDate: dueDate.value
            });
            resetForm();
        } catch (error) {
            onError?.(error);
        } finally {
            createButton.disabled = false;
            createButton.textContent =
                createButton.dataset.defaultText || "Create Assignment";
        }
    }

    title.addEventListener("input", updateCounters);
    description.addEventListener("input", updateCounters);
    form.addEventListener("submit", handleSubmit);

    updateCounters();

    return {
        reset: resetForm,
        destroy() {
            title.removeEventListener("input", updateCounters);
            description.removeEventListener("input", updateCounters);
            form.removeEventListener("submit", handleSubmit);
        }
    };
}
