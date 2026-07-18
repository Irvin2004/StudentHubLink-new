import { MESSAGE_TYPES } from "./constants.js?messaging=13";

const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;

export function sanitizeInput(value) {
    return String(value ?? "").trim();
}

export function validateMessageInput({
    type = MESSAGE_TYPES.TEXT,
    text = "",
    fileUrl = null
}) {
    if (type === MESSAGE_TYPES.TEXT && !sanitizeInput(text)) {
        throw new Error("Message cannot be empty.");
    }

    if (type !== MESSAGE_TYPES.TEXT && !fileUrl) {
        throw new Error("Message attachment is missing.");
    }

    return true;
}

export function validateMessageFile(
    file,
    { maxSize = DEFAULT_MAX_FILE_SIZE } = {}
) {
    if (!(file instanceof File)) {
        throw new Error("Please select a valid file.");
    }

    if (file.size > maxSize) {
        throw new Error("File must be 25 MB or smaller.");
    }

    return true;
}

export function sanitizeUrl(value) {
    if (!value) return "#";

    try {
        const url = new URL(value, "https://studenthub.local");

        if (!["http:", "https:", "blob:"].includes(url.protocol)) {
            return "#";
        }

        return value;
    } catch {
        return "#";
    }
}
