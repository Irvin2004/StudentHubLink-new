const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

function validateTitle(title) {
    if (typeof title !== "string") {
        throw new Error("Title is required.");
    }

    const trimmed = title.trim();

    if (!trimmed) {
        throw new Error("Title is required.");
    }

    if (trimmed.length > TITLE_MAX_LENGTH) {
        throw new Error(
            `Title cannot exceed ${TITLE_MAX_LENGTH} characters.`
        );
    }

    return trimmed;
}

function validateDescription(description = "") {
    if (typeof description !== "string") {
        throw new Error("Description must be text.");
    }

    const trimmed = description.trim();

    if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
        throw new Error(
            `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`
        );
    }

    return trimmed;
}

function validateDueDate(dueDate) {
    if (!dueDate) {
        throw new Error("Due date is required.");
    }

    const date = new Date(dueDate);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid due date.");
    }

    return date;
}

export function validateAssignment(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Assignment data is required.");
    }

    return {
        title: validateTitle(data.title),
        description: validateDescription(data.description),
        dueDate: validateDueDate(data.dueDate)
    };
}

export function createAssignmentModel(data) {
    const assignment = validateAssignment(data);

    return {
        ...assignment,
        createdBy: data.createdBy,
        createdAt: null,
        updatedAt: null
    };
}

export function createAssignmentUpdateModel(updates) {
    if (!updates || typeof updates !== "object") {
        throw new Error("Assignment updates are required.");
    }

    const cleanUpdates = {};

    if (Object.hasOwn(updates, "title")) {
        cleanUpdates.title = validateTitle(updates.title);
    }

    if (Object.hasOwn(updates, "description")) {
        cleanUpdates.description = validateDescription(
            updates.description
        );
    }

    if (Object.hasOwn(updates, "dueDate")) {
        cleanUpdates.dueDate = validateDueDate(updates.dueDate);
    }

    if (!Object.keys(cleanUpdates).length) {
        throw new Error("Provide at least one assignment field to update.");
    }

    return cleanUpdates;
}
