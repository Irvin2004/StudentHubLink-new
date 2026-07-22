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
import {
    createAssignmentModel,
    createAssignmentUpdateModel
} from "../models/assignment.js";
import { emitAssignmentCreated } from "../events/assignment-events.js";
import { error as logError } from "../utils/logger.js";

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

function getAssignmentsCollection(groupId) {
    return collection(
        db,
        COLLECTIONS.GROUPS,
        groupId,
        "assignments"
    );
}

function getAssignmentReference(groupId, assignmentId) {
    return doc(
        getAssignmentsCollection(groupId),
        assignmentId
    );
}

function convertDueDate(dueDate) {
    return Timestamp.fromDate(dueDate);
}

function normalizeFirestoreError(error) {
    const code = String(error?.code || "")
        .replace(/^firestore\//, "");

    if (code === "permission-denied") {
        const permissionError = new Error("Permission denied.", {
            cause: error
        });
        permissionError.code = "permission-denied";
        return permissionError;
    }

    return error;
}

async function runFirestoreOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        throw normalizeFirestoreError(error);
    }
}

export async function createAssignment(
    groupId,
    assignmentData = {}
) {
    const cleanGroupId = validateGroupId(groupId);
    const {
        title,
        description,
        dueDate,
        createdBy
    } = createAssignmentModel(assignmentData);

    const assignment = await runFirestoreOperation(async () => {
        const assignmentRef = await addDoc(
            getAssignmentsCollection(cleanGroupId),
            {
                title,
                description,
                createdBy,
                dueDate: convertDueDate(dueDate),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );

        const savedAssignment = await getDoc(assignmentRef);

        return {
            id: savedAssignment.id,
            groupId: cleanGroupId,
            ...savedAssignment.data()
        };
    });

    try {
        await emitAssignmentCreated({
            assignment,
            groupId: cleanGroupId,
            creatorId: createdBy
        });
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            "Could not emit assignment-created notifications:",
            error
        );
    }

    return assignment;
}

export async function getAssignments(groupId) {
    const cleanGroupId = validateGroupId(groupId);
    return runFirestoreOperation(async () => {
        const assignmentsQuery = query(
            getAssignmentsCollection(cleanGroupId),
            orderBy("dueDate", "asc")
        );
        const snapshot = await getDocs(assignmentsQuery);

        return snapshot.docs.map((assignmentDocument) => ({
            id: assignmentDocument.id,
            groupId: cleanGroupId,
            ...assignmentDocument.data()
        }));
    });
}

export async function getAssignment(groupId, assignmentId) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = validateAssignmentId(assignmentId);
    return runFirestoreOperation(async () => {
        const snapshot = await getDoc(
            getAssignmentReference(
                cleanGroupId,
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
    });
}

export async function updateAssignment(
    groupId,
    assignmentId,
    updates = {}
) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = validateAssignmentId(assignmentId);
    const validatedUpdates = createAssignmentUpdateModel(updates);

    const firestoreUpdates = {
        ...validatedUpdates,
        updatedAt: serverTimestamp()
    };

    if (validatedUpdates.dueDate) {
        firestoreUpdates.dueDate = convertDueDate(
            validatedUpdates.dueDate
        );
    }

    await runFirestoreOperation(() => updateDoc(
        getAssignmentReference(cleanGroupId, cleanAssignmentId),
        firestoreUpdates
    ));

    return getAssignment(cleanGroupId, cleanAssignmentId);
}

export async function deleteAssignment(groupId, assignmentId) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanAssignmentId = validateAssignmentId(assignmentId);

    await runFirestoreOperation(() => deleteDoc(
        getAssignmentReference(cleanGroupId, cleanAssignmentId)
    ));
}
