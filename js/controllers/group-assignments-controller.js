import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../src/firebase/auth.js";
import {
    createAssignmentModal,
    setAssignmentModalMode
} from "../components/assignment-modal.js";
import { closeModal, openModal } from "../components/modal.js";
import { openConfirmationDialog } from "../components/confirmation-dialog.js";
import {
    initializeAssignmentForm,
    populateAssignmentForm
} from "./assignment-form-controller.js";
import {
    createAssignment,
    deleteAssignment,
    getAssignments,
    updateAssignment
} from "../services/assignment-service.js";
import {
    getStudyGroup,
    getStudyGroupMemberships
} from "../services/group-service.js?security=1";
import { renderAssignments } from "../renderers/assignment-renderer.js?v=20260721-2";
import { setText } from "../utils/dom.js";
import { handleError } from "../services/user-feedback-service.js";
import { showSkeleton } from "../renderers/skeleton-renderer.js";
import { SKELETON_TYPES } from "../config/skeleton-types.js";
import { hideSkeleton } from "../renderers/skeleton-renderer.js";
import { error as logError } from "../utils/logger.js";
import { showToast } from "../services/user-feedback-service.js";

const groupId = new URLSearchParams(window.location.search).get("id");
const pageSection = document.getElementById("groupAssignments");
const accessMessage = document.getElementById("assignmentAccessMessage");
const assignmentsList = document.getElementById("assignmentsList");
const newAssignmentButton = document.getElementById("newAssignmentButton");

let currentUser = null;
let canManageAssignments = false;
let assignmentFormController = null;
let currentAssignment = null;
let assignmentsById = new Map();

function parseLocalDueDate(value) {
    const parts = String(value || "")
        .split("-")
        .map(Number);

    if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
        throw new Error("Choose a valid due date.");
    }

    const [year, month, day] = parts;
    const dueDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    if (
        dueDate.getFullYear() !== year ||
        dueDate.getMonth() !== month - 1 ||
        dueDate.getDate() !== day
    ) {
        throw new Error("Choose a valid due date.");
    }

    return dueDate;
}

function openAssignmentForm() {
    if (canManageAssignments) {
        resetAssignmentModal();
        openModal("assignmentModal");
    }
}

function openEditAssignment(assignment) {
    if (!canManageAssignments || !assignment) {
        return;
    }

    currentAssignment = assignment;
    setAssignmentModalMode("edit");
    populateAssignmentForm(assignment);
    openModal("assignmentModal");
}

function resetAssignmentModal() {
    currentAssignment = null;
    assignmentFormController?.reset();
    setAssignmentModalMode("create");
}

async function confirmDeleteAssignment(assignmentId, deleteButton) {
    const assignment = assignmentsById.get(assignmentId);

    if (!assignment || !canManageAssignments) {
        return;
    }

    deleteButton.disabled = true;

    const confirmed = await openConfirmationDialog({
        title: "Delete Assignment?",
        message: "This action cannot be undone.",
        confirmLabel: "Delete",
        danger: true
    });

    if (!confirmed) {
        deleteButton.disabled = false;
        return;
    }

    deleteButton.textContent = "Deleting...";

    try {
        await deleteAssignment(groupId, assignmentId);
        await loadAssignments();
        showToast("Assignment deleted successfully.", "success");
    } catch (error) {
        deleteButton.disabled = false;
        deleteButton.innerHTML = `
            <span aria-hidden="true">&#128465;</span>
            Delete
        `;
        handleError(error, "Unable to delete this assignment.");
    }
}

async function loadAssignments() {
    assignmentsList.setAttribute("aria-busy", "true");
    showSkeleton(assignmentsList, SKELETON_TYPES.FILE, { count: 3 });

    try {
        const assignments = await getAssignments(groupId);
        assignmentsById = new Map(
            assignments.map((assignment) => [assignment.id, assignment])
        );
        hideSkeleton(assignmentsList);
        renderAssignments(assignments, assignmentsList);
    } finally {
        assignmentsList.setAttribute("aria-busy", "false");
    }
}

function renderAssignmentLoadError(error) {
    logError("FIRESTORE", "Unable to load group assignments.", error);
    assignmentsList.innerHTML = `
        <div class="assignment-empty-state assignment-error-state">
            <span aria-hidden="true">&#9888;</span>
            <h2>Assignments unavailable</h2>
            <p>We could not load this group's assignments. Try again after the assignment rules are deployed.</p>
        </div>
    `;
}

async function initializePage(user) {
    if (!groupId) {
        window.location.href = "groups.html";
        return;
    }

    try {
        const [group, memberships] = await Promise.all([
            getStudyGroup(groupId),
            getStudyGroupMemberships([groupId], user.uid)
        ]);
        const isMember = memberships.has(groupId);

        document.getElementById("assignmentGroupBackLink").href =
            `group-details.html?id=${encodeURIComponent(groupId)}`;
        setText("assignmentPageTitle", `${group.name} Assignments`);

        if (!isMember) {
            accessMessage.textContent =
                "Join this study group to view its assignments.";
            return;
        }

        canManageAssignments = true;
        accessMessage.classList.add("hidden");
        pageSection.classList.remove("hidden");

        try {
            await loadAssignments();
        } catch (error) {
            renderAssignmentLoadError(error);
        }
    } catch (error) {
        handleError(error, "Unable to load group assignments.");
        accessMessage.textContent =
            "Group assignments are unavailable right now.";
    }
}

newAssignmentButton?.addEventListener("click", openAssignmentForm);

async function handleAssignmentClick(event) {
    if (event.target.closest("[data-assignment-create]")) {
        openAssignmentForm();
        return;
    }

    const editButton = event.target.closest('[data-assignment-action="edit"]');

    if (editButton) {
        const assignmentId = editButton.closest("[data-assignment-id]")?.dataset
            .assignmentId;
        openEditAssignment(assignmentsById.get(assignmentId));
        return;
    }

    const deleteButton = event.target.closest(".assignment-delete");

    if (deleteButton) {
        await confirmDeleteAssignment(
            deleteButton.dataset.assignmentId,
            deleteButton
        );
    }
}

assignmentsList?.addEventListener("click", handleAssignmentClick);

if (!document.getElementById("assignmentModal")) {
    document.body.insertAdjacentHTML("beforeend", createAssignmentModal());
}

assignmentFormController = initializeAssignmentForm({
    async onSubmit({ title, description, dueDate }) {
        if (!currentUser || !canManageAssignments) {
            throw new Error(
                "Join this study group before creating an assignment."
            );
        }

        const assignmentData = {
            title,
            description,
            dueDate: parseLocalDueDate(dueDate)
        };
        const assignmentBeingEdited = currentAssignment;

        if (assignmentBeingEdited) {
            await updateAssignment(
                groupId,
                assignmentBeingEdited.id,
                assignmentData
            );
        } else {
            await createAssignment(groupId, {
                ...assignmentData,
                createdBy: currentUser.uid
            });
        }

        closeModal("assignmentModal");
        showToast(
            assignmentBeingEdited
                ? "Assignment updated successfully."
                : "Assignment created successfully.",
            "success"
        );

        try {
            await loadAssignments();
        } catch (error) {
            renderAssignmentLoadError(error);
        }
    },
    onError(error) {
        handleError(
            error,
            currentAssignment
                ? "Unable to update this assignment."
                : "Unable to create this assignment."
        );
    }
});

document
    .getElementById("assignmentModal")
    ?.addEventListener("modal:closed", resetAssignmentModal);

setAssignmentModalMode("create");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = user;
    initializePage(user);
});
