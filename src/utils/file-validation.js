export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const ALLOWED_FILE_EXTENSIONS = Object.freeze([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "zip",
    "txt",
    "csv"
]);

const INVALID_FILE_NAME = /[<>:"/\\|?*]/;

function hasControlCharacter(value) {
    return [...value].some((character) => character.charCodeAt(0) < 32);
}

export function getFileExtension(fileName) {
    const normalized = String(fileName || "").trim();
    const lastDot = normalized.lastIndexOf(".");

    return lastDot > 0 ? normalized.slice(lastDot + 1).toLowerCase() : "";
}

export function sanitizeStorageFileName(fileName) {
    const normalized = String(fileName || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[.-]+|[.-]+$/g, "")
        .toLowerCase();

    return normalized || "file";
}

export function validateFile(file) {
    if (!(file instanceof File)) {
        throw new TypeError("Choose a valid file.");
    }

    const name = file.name.trim();
    const extension = getFileExtension(name);

    if (!name || INVALID_FILE_NAME.test(name) || hasControlCharacter(name)) {
        throw new TypeError("The filename contains invalid characters.");
    }

    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
        throw new TypeError(
            `.${extension || "unknown"} files are not supported.`
        );
    }

    if (file.size <= 0) {
        throw new TypeError("Empty files cannot be uploaded.");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new TypeError("Files must be 25 MB or smaller.");
    }

    return {
        extension,
        name,
        originalName: name,
        size: file.size,
        type: file.type || "application/octet-stream"
    };
}

export function validateFiles(files) {
    return Array.from(files || []).map((file) => ({
        file,
        metadata: validateFile(file)
    }));
}
