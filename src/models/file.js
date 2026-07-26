import { canDeleteCommunityFile } from "../config/community-permissions.js";
import { getFileExtension } from "../utils/file-validation.js";

function text(value) {
    return String(value ?? "").trim();
}

export function createFileModel(input = {}) {
    const originalName = text(input.originalName || input.name);
    const uploadedBy = text(input.uploadedBy);

    if (!text(input.id)) throw new TypeError("A file ID is required.");
    if (!originalName) throw new TypeError("A filename is required.");
    if (!uploadedBy) throw new TypeError("An uploader ID is required.");

    return {
        id: text(input.id),
        name: text(input.name) || originalName,
        filename: text(input.filename) || originalName,
        normalizedFilename:
            text(input.normalizedFilename).toLowerCase() ||
            originalName.toLowerCase(),
        originalName,
        extension:
            text(input.extension).toLowerCase() ||
            getFileExtension(originalName),
        size: Number(input.size) || 0,
        type: text(input.type) || "application/octet-stream",
        url: text(input.url),
        storagePath: text(input.storagePath),
        uploadedBy,
        uploadedByName: text(input.uploadedByName) || "Student",
        uploadedAt: input.uploadedAt || null,
        communityId: text(input.communityId),
        channelId: text(input.channelId),
        messageId: text(input.messageId) || null,
        tags: Array.isArray(input.tags)
            ? input.tags.map(text).filter(Boolean)
            : []
    };
}

export function canDeleteFile(file, userId, role) {
    return canDeleteCommunityFile(file, userId, role);
}
