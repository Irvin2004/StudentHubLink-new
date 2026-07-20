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

function convertDueDate(dueDate) {
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

function validateAssignmentData({
    title,
    description,
    dueDate,
    creator
}) {
    const cleanTitle = cleanText(title);
    const cleanDescription = cleanText(description);

    if (!cleanTitle) {
        throw new Error("Assignment title is required.");
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
        throw new Error(
            `Assignment title cannot exceed ${MAX_TITLE_LENGTH} characters.`
        );
    }

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
            `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
    }

    if (!dueDate) {
        throw new Error("Assignment due date is required.");
    }

    if (!creator?.uid) {
        throw new Error(
            "A signed-in user is required to create an assignment."
        );
    }
}

export async function createAssignment({
    groupId,
    title,
    description = "",
    dueDate,
    creator
}) {
    const cleanGroupId = validateGroupId(groupId);

    validateAssignmentData({
        title,
        description,
        dueDate,
        creator
    });

    const cleanTitle = cleanText(title);
    const cleanDescription = cleanText(description);
    const dueTimestamp = convertDueDate(dueDate);

    const assignmentRef = await addDoc(
        collection(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments"
        ),
        {
            title: cleanTitle,
            description: cleanDescription,
            dueDate: dueTimestamp,

            createdBy: creator.uid,
            creatorName:
                creator.displayName ||
                creator.email ||
                "Student",
            creatorPhotoURL: creator.photoURL || "",

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

export async function getAssignment({
    groupId,
    assignmentId
}) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = cleanText(assignmentId);

    if (!cleanAssignmentId) {
        throw new Error("Assignment ID is required.");
    }

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

export async function updateAssignment({
    groupId,
    assignmentId,
    title,
    description = "",
    dueDate
}) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = cleanText(assignmentId);
    const cleanTitle = cleanText(title);
    const cleanDescription = cleanText(description);

    if (!cleanAssignmentId) {
        throw new Error("Assignment ID is required.");
    }

    if (!cleanTitle) {
        throw new Error("Assignment title is required.");
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
        throw new Error(
            `Assignment title cannot exceed ${MAX_TITLE_LENGTH} characters.`
        );
    }

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
            `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
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
            title: cleanTitle,
            description: cleanDescription,
            dueDate: convertDueDate(dueDate),
            updatedAt: serverTimestamp()
        }
    );
}

export async function deleteAssignment({
    groupId,
    assignmentId
}) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = cleanText(assignmentId);

    if (!cleanAssignmentId) {
        throw new Error("Assignment ID is required.");
    }

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
