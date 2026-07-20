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

function convertDueDate(dueDate) {
    return Timestamp.fromDate(dueDate);
}

export async function createAssignment(
    groupId,
    assignmentData = {}
) {
    const cleanGroupId = validateGroupId(groupId);
    const assignment = createAssignmentModel(assignmentData);

    const assignmentRef = await addDoc(
        collection(
            db,
            COLLECTIONS.GROUPS,
            cleanGroupId,
            "assignments"
        ),
        {
            ...assignment,
            dueDate: convertDueDate(assignment.dueDate),
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
    const validatedUpdates = createAssignmentUpdateModel(updates);

    if (validatedUpdates.dueDate) {
        validatedUpdates.dueDate = convertDueDate(
            validatedUpdates.dueDate
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
            ...validatedUpdates,
            updatedAt: serverTimestamp()
        }
    );

    return getAssignment(cleanGroupId, cleanAssignmentId);
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
