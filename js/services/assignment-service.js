import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

function cleanText(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function validateGroupId(groupId) {
    const cleanGroupId = cleanText(groupId);

    if (!cleanGroupId) {
        throw new Error("Group ID is required.");
    }

    return cleanGroupId;
}

function validateAssignmentId(assignmentId) {
    const cleanAssignmentId = cleanText(assignmentId);

    if (!cleanAssignmentId) {
        throw new Error("Assignment ID is required.");
    }

    return cleanAssignmentId;
}

function validateTitle(title) {
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

function validateDescription(description = "") {
    const cleanDescription = cleanText(description);

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
            `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
    }

    return cleanDescription;
}

function convertDueDate(dueDate) {
    if (!dueDate) {
        throw new Error("Assignment due date is required.");
    }

    if (dueDate instanceof Date) {
        if (Number.isNaN(dueDate.getTime())) {
            throw new Error("Choose a valid due date.");
        }

        return Timestamp.fromDate(dueDate);
    }

    const parsedDate = new Date(dueDate);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Choose a valid due date.");
    }

    return Timestamp.fromDate(parsedDate);
}

function getCreatorDetails(assignmentData) {
    const creator = assignmentData.creator;
    const createdBy = cleanText(
        assignmentData.createdBy || creator?.uid
    );

    if (!createdBy) {
        throw new Error(
            "A signed-in user is required to create an assignment."
        );
    }

    return {
        createdBy,
        creatorName: cleanText(
            assignmentData.creatorName ||
            creator?.displayName ||
            creator?.email
        ) || "Student",
        creatorPhotoURL: cleanText(
            assignmentData.creatorPhotoURL || creator?.photoURL
        )
    };
}

export async function createAssignment(
    groupId,
    assignmentData = {}
) {
    const cleanGroupId = validateGroupId(groupId);
    const title = validateTitle(assignmentData.title);
    const description = validateDescription(
        assignmentData.description
    );
    const dueDate = convertDueDate(assignmentData.dueDate);
    const creatorDetails = getCreatorDetails(assignmentData);

    const assignmentRef = await addDoc(
        collection(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments"
        ),
        {
            title,
            description,
            dueDate,
            ...creatorDetails,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    return assignmentRef.id;
}

export async function getAssignments(groupId) {
    const cleanGroupId = validateGroupId(groupId);
    const assignmentsQuery = query(
        collection(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments"
        ),
        orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(assignmentsQuery);

    return snapshot.docs.map((assignmentDocument) => ({
        id: assignmentDocument.id,
        groupId: cleanGroupId,
        ...assignmentDocument.data()
    }));
}

export async function getAssignment(groupId, assignmentId) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = validateAssignmentId(assignmentId);
    const snapshot = await getDoc(
        doc(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments",
            cleanAssignmentId
        )
    );

    if (!snapshot.exists()) {
        throw new Error("Assignment not found.");
    }

    return {
        id: snapshot.id,
        groupId: cleanGroupId,
        ...snapshot.data()
    };
}

export async function updateAssignment(
    groupId,
    assignmentId,
    updates = {}
) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = validateAssignmentId(assignmentId);
    const validatedUpdates = {};

    if (Object.hasOwn(updates, "title")) {
        validatedUpdates.title = validateTitle(updates.title);
    }

    if (Object.hasOwn(updates, "description")) {
        validatedUpdates.description = validateDescription(
            updates.description
        );
    }

    if (Object.hasOwn(updates, "dueDate")) {
        validatedUpdates.dueDate = convertDueDate(updates.dueDate);
    }

    if (!Object.keys(validatedUpdates).length) {
        throw new Error("Provide at least one assignment field to update.");
    }

    await updateDoc(
        doc(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments",
            cleanAssignmentId
        ),
        {
            ...validatedUpdates,
            updatedAt: serverTimestamp()
        }
    );
}

export async function deleteAssignment(groupId, assignmentId) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = validateAssignmentId(assignmentId);

    await deleteDoc(
        doc(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments",
            cleanAssignmentId
        )
    );
}
