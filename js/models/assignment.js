const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

function cleanText(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function normalizeTitle(title) {
    const cleanTitle = cleanText(title);

    if (!cleanTitle) {
        throw new Error("Assignment title is required.");
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
        throw new Error(
            `Assignment title cannot exceed ${MAX_TITLE_LENGTH} characters.`
        );
    }

    return cleanTitle;
}

function normalizeDescription(description = "") {
    const cleanDescription = cleanText(description);

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
            `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
    }

    return cleanDescription;
}

function normalizeDueDate(dueDate) {
    if (!dueDate) {
        throw new Error("Assignment due date is required.");
    }

    const normalizedDate = dueDate instanceof Date
        ? new Date(dueDate.getTime())
        : new Date(dueDate);

    if (Number.isNaN(normalizedDate.getTime())) {
        throw new Error("Choose a valid due date.");
    }

    return normalizedDate;
}

function normalizeCreator(data) {
    const creator = data.creator;
    const createdBy = cleanText(data.createdBy || creator?.uid);

    if (!createdBy) {
        throw new Error(
            "A signed-in user is required to create an assignment."
        );
    }

    return {
        createdBy,
        creatorName: cleanText(
            data.creatorName ||
            creator?.displayName ||
            creator?.email
        ) || "Student",
        creatorPhotoURL: cleanText(
            data.creatorPhotoURL || creator?.photoURL
        )
    };
}

export function validateAssignment(data = {}) {
    return {
        title: normalizeTitle(data.title),
        description: normalizeDescription(data.description),
        dueDate: normalizeDueDate(data.dueDate)
    };
}

export function createAssignmentModel(data = {}) {
    return {
        ...validateAssignment(data),
        ...normalizeCreator(data)
    };
}

export function createAssignmentUpdateModel(updates = {}) {
    const cleanUpdates = {};

    if (Object.hasOwn(updates, "title")) {
        cleanUpdates.title = normalizeTitle(updates.title);
    }

    if (Object.hasOwn(updates, "description")) {
        cleanUpdates.description = normalizeDescription(
            updates.description
        );
    }

    if (Object.hasOwn(updates, "dueDate")) {
        cleanUpdates.dueDate = normalizeDueDate(updates.dueDate);
    }

    if (!Object.keys(cleanUpdates).length) {
        throw new Error("Provide at least one assignment field to update.");
    }

    return cleanUpdates;
}
