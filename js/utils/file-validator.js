const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed"
];

const ALLOWED_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".zip"
];

export function validateAttachment(file) {
    if (!(file instanceof File)) {
        throw new Error("Please select a valid file.");
    }

    if (file.size <= 0) {
        throw new Error("The selected file is empty.");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("Maximum file size is 25 MB.");
    }

    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) =>
        lowerName.endsWith(extension)
    );

    if (!ALLOWED_TYPES.includes(file.type) || !hasAllowedExtension) {
        throw new Error("Unsupported file type.");
    }

    return true;
}

export { ALLOWED_EXTENSIONS, ALLOWED_TYPES, MAX_FILE_SIZE };
