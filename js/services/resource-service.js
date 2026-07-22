import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import {
    isValidResourceCategory
} from "../config/resource-categories.js";
import {
    ALLOWED_EXTENSIONS,
    ALLOWED_TYPES,
    MAX_FILE_SIZE
} from "../utils/file-validator.js?security=1";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateResourceData({
    groupId,
    title,
    category,
    fileURL,
    fileName,
    fileSize,
    mimeType,
    uploader
}) {
    if (!groupId) {
        throw new Error("Group ID is required.");
    }

    const cleanTitle = cleanText(title);

    if (!cleanTitle) {
        throw new Error("Resource title is required.");
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
        throw new Error(
            `Resource title cannot exceed ${MAX_TITLE_LENGTH} characters.`
        );
    }

    if (!isValidResourceCategory(category)) {
        throw new Error("Select a valid resource category.");
    }

    if (!fileURL) {
        throw new Error("Uploaded file URL is required.");
    }

    if (!fileName) {
        throw new Error("File name is required.");
    }

    if (typeof fileSize !== "number" || fileSize <= 0) {
        throw new Error("A valid file size is required.");
    }

    if (fileSize > MAX_FILE_SIZE) {
        throw new Error("Maximum file size is 25 MB.");
    }

    const lowerFileName = fileName.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some(
        (extension) => lowerFileName.endsWith(extension)
    );

    if (
        !ALLOWED_TYPES.includes(mimeType) ||
        !hasAllowedExtension
    ) {
        throw new Error("Unsupported file type.");
    }

    if (!uploader?.uid) {
        throw new Error(
            "A signed-in user is required to upload resources."
        );
    }
}

export async function createGroupResource({
    groupId,
    title,
    description = "",
    category,
    fileURL,
    storagePath,
    fileName,
    fileSize,
    mimeType,
    uploader
}) {
    validateResourceData({
        groupId,
        title,
        category,
        fileURL,
        fileName,
        fileSize,
        mimeType,
        uploader
    });

    const cleanTitle = cleanText(title);
    const cleanDescription = cleanText(description);

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
            `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
    }

    const resourceReference = await addDoc(
        collection(db, "groups", groupId, "resources"),
        {
            title: cleanTitle,
            description: cleanDescription,
            category,
            fileURL,
            storagePath: storagePath || "",
            fileName,
            fileSize,
            mimeType,
            uploaderId: uploader.uid,
            uploaderName:
                uploader.displayName || uploader.email || "Student",
            uploaderPhotoURL: uploader.photoURL || "",
            downloadCount: 0,
            verificationCount: 0,
            verifiedBy: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    return resourceReference.id;
}

export async function getGroupResources(groupId) {
    if (!groupId) {
        throw new Error("Group ID is required.");
    }

    const resourcesQuery = query(
        collection(db, "groups", groupId, "resources"),
        orderBy("createdAt", "desc"),
        limit(100)
    );
    const snapshot = await getDocs(resourcesQuery);

    return snapshot.docs.map((resourceDocument) => ({
        id: resourceDocument.id,
        groupId,
        ...resourceDocument.data()
    }));
}

export async function getGroupResource({ groupId, resourceId }) {
    if (!groupId || !resourceId) {
        throw new Error("Group ID and resource ID are required.");
    }

    const resourceSnapshot = await getDoc(
        doc(db, "groups", groupId, "resources", resourceId)
    );

    if (!resourceSnapshot.exists()) {
        throw new Error("Resource not found.");
    }

    return {
        id: resourceSnapshot.id,
        groupId,
        ...resourceSnapshot.data()
    };
}
