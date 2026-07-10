import { app, auth, db } from "../firebase.js";
import { createActivity } from "./activity.js";
import { createNotification } from "./notifications.js";
import { handleResourceAction } from "./marketplace-actions.js";
import {
    getResourceAction,
    getReviewStatus,
    RESOURCE_ACTION,
    RESOURCE_STATUS,
    REVIEW_ACTION
} from "../utils/constants.js";
import { escapeHtml, setText } from "../utils/dom.js";
import { formatPrice } from "../utils/formatPrice.js";
import { error as logError } from "../utils/logger.js";
import { showToast } from "../utils/toast.js";

import {
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    increment,
    query,
    serverTimestamp,
    updateDoc,
    where
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const storage = getStorage(app);

const resourceId =
new URLSearchParams(window.location.search).get("id");

async function getUserProfile(user) {
    const snapshot =
    await getDoc(doc(db, "users", user.uid));

    if (!snapshot.exists()) {
        return {
            name: user.displayName || "Student",
            fullName: user.displayName || "Student",
            email: user.email,
            role: "student"
        };
    }

    return snapshot.data();
}

async function uploadResource(user) {
    const title =
    document.getElementById("resourceTitle").value.trim();

    const description =
    document.getElementById("resourceDescription").value.trim();

    const category =
    document.getElementById("resourceCategory").value;

    const price =
    Number(document.getElementById("resourcePrice").value || 0);

    const fileInput =
    document.getElementById("resourceFile");

    const message =
    document.getElementById("uploadMessage");

    if (!title || !description || !category || !fileInput.files[0]) {
        message.textContent = "Please complete all required fields.";
        return;
    }

    if (price < 0) {
        message.textContent = "Price cannot be negative.";
        return;
    }

    const file =
    fileInput.files[0];

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/zip",
        "application/x-zip-compressed"
    ];

    const allowedExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".zip"
    ];

    const fileName =
    file.name.toLowerCase();

    const hasAllowedType =
    allowedTypes.includes(file.type);

    const hasAllowedExtension =
    allowedExtensions.some((extension) => fileName.endsWith(extension));

    if (!hasAllowedType && !hasAllowedExtension) {
        message.textContent =
        "Only PDF, JPG, PNG and ZIP files are allowed.";

        return;
    }

    const MAX_SIZE = 20 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
        message.textContent = "File size exceeds the 20MB limit.";
        return;
    }

    const uploadBtn =
    document.getElementById("uploadResourceBtn");

    uploadBtn.disabled = true;
    message.textContent = "Uploading resource...";

    try {
        const userProfile =
        await getUserProfile(user);

        const safeFileName =
        file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();

        const filePath =
        `resources/${user.uid}/${Date.now()}-${safeFileName}`;

        const storageRef =
        ref(storage, filePath);

        await uploadBytes(storageRef, file);

        const fileUrl =
        await getDownloadURL(storageRef);

        const ownerName =
        userProfile.name || userProfile.fullName || user.displayName || "Student";

        const resourceRef =
        await addDoc(collection(db, "resources"), {
            title,
            description,
            category,
            ownerId: user.uid,
            price,
            approved: false,
            downloadCount: 0,
            currency: "ZAR",
            fileType: file.type || "application/octet-stream",
            fileUrl,
            filePath,
            fileName: file.name,
            ownerName,
            ownerEmail: user.email,
            status: RESOURCE_STATUS.PENDING,
            purchaseCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            totalUploads: increment(1),
            updatedAt: serverTimestamp()
        }, {
            merge: true
        });

        try {
            await createActivity({
                userId: user.uid,
                type: "upload",
                title: "Resource uploaded",
                description: `${title} was uploaded for admin approval.`,
                icon: "upload",
                resourceId: resourceRef.id,
                ownerId: user.uid,
                ownerName
            });
        } catch (error) {
            logError("FIRESTORE", "Upload activity failed:", error);
        }

        message.textContent = "Resource uploaded for admin approval.";
        document.getElementById("resourceUploadForm").reset();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        uploadBtn.disabled = false;
    }
}

async function loadResourceDetails(user) {
    const details =
    document.getElementById("resourceDetails");

    if (!details) {
        return;
    }

    if (!resourceId) {
        details.innerHTML = "<p>Resource not found.</p>";
        return;
    }

    const snapshot =
    await getDoc(doc(db, "resources", resourceId));

    if (!snapshot.exists()) {
        details.innerHTML = "<p>Resource not found.</p>";
        return;
    }

    const resource = {
        id: snapshot.id,
        ...snapshot.data()
    };

    if (resource.approved !== true && resource.ownerId !== user.uid) {
        details.innerHTML = "<p>This resource is not available.</p>";
        return;
    }

    setText("detailTitle", resource.title);
    setText("detailDescription", resource.description);
    setText("detailCategory", resource.category);
    setText("detailUploader", resource.ownerName || "Student");

    const detailUploader =
    document.getElementById("detailUploader");

    if (detailUploader && resource.ownerId) {
        detailUploader.href =
        `user-profile.html?id=${encodeURIComponent(resource.ownerId)}`;
    }

    setText("detailPrice", formatPrice(resource.price));
    setText("detailDownloads", Number(resource.downloadCount || 0));
    setText("detailStatus", resource.approved ? RESOURCE_STATUS.APPROVED : (resource.status || RESOURCE_STATUS.PENDING));

    const actionBtn =
    document.getElementById("resourceActionBtn");

    if (resource.approved !== true) {
        actionBtn.textContent = "Awaiting Approval";
        actionBtn.disabled = true;
        return;
    }

    actionBtn.textContent =
    Number(resource.price || 0) > 0 ? "Purchase and Download" : "Download";

    actionBtn.addEventListener("click", async () => {
        const type =
        getResourceAction(resource);

        if (type === RESOURCE_ACTION.PURCHASE) {
            const confirmed =
            window.confirm(`Confirm purchase for ${formatPrice(resource.price)}?`);

            if (!confirmed) {
                return;
            }
        }

        actionBtn.disabled = true;

        try {
            await handleResourceAction(resource, user);
            window.open(resource.fileUrl, "_blank");
            actionBtn.textContent = "Downloaded";
        } catch (error) {
            showToast(error.message || "Something went wrong.", "error");
            actionBtn.disabled = false;
        }
    });
}

function pendingResourceRow(resource) {
    return `
        <tr>
            <td>${escapeHtml(resource.title)}</td>
            <td>${escapeHtml(resource.ownerName || resource.ownerEmail || "Student")}</td>
            <td>${escapeHtml(resource.category)}</td>
            <td>${formatPrice(resource.price)}</td>
            <td>
                <button class="approve" data-action="approve" data-id="${resource.id}">
                    Approve
                </button>

                <button class="reject" data-action="reject" data-id="${resource.id}">
                    Reject
                </button>
            </td>
        </tr>
    `;
}

async function loadPendingResources(user) {
    const tableBody =
    document.getElementById("pendingResourcesTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="5">Loading pending resources...</td>
        </tr>
    `;

    const pendingQuery =
    query(collection(db, "resources"), where("status", "==", RESOURCE_STATUS.PENDING));

    const snapshot =
    await getDocs(pendingQuery);

    const resources = [];

    snapshot.forEach((item) => {
        resources.push({
            id: item.id,
            ...item.data()
        });
    });

    tableBody.innerHTML =
    resources.length > 0 ?
    resources.map(pendingResourceRow).join("") :
    `
        <tr>
            <td colspan="5">No pending resources.</td>
        </tr>
    `;

    tableBody.onclick = async (event) => {
        const button =
        event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const status =
        getReviewStatus(button.dataset.action);

        const approved =
        button.dataset.action === REVIEW_ACTION.APPROVE;

        button.disabled = true;

        await updateDoc(doc(db, "resources", button.dataset.id), {
            approved,
            status,
            reviewedBy: user.uid,
            reviewedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        const reviewedResource =
        resources.find((resource) => resource.id === button.dataset.id);

        await createNotification(
            reviewedResource?.ownerId,
            approved ? "Resource approved" : "Resource rejected",
            approved ?
            `${reviewedResource?.title || "Your resource"} is now available.` :
            `${reviewedResource?.title || "Your resource"} was not approved.`
        );

        await createActivity({
            userId: reviewedResource?.ownerId,
            type: approved ? "approval" : "rejection",
            title: approved ? "Resource approved" : "Resource rejected",
            description: approved ?
            `${reviewedResource?.title || "Your resource"} is now available.` :
            `${reviewedResource?.title || "Your resource"} was not approved.`,
            icon: approved ? "approval" : "info",
            resourceId: reviewedResource?.id,
            ownerId: reviewedResource?.ownerId,
            ownerName: reviewedResource?.ownerName
        });

        await loadPendingResources(user);
    };
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    const pendingTable =
    document.getElementById("pendingResourcesTableBody");

    if (pendingTable) {
        const userProfile =
        await getUserProfile(user);

        if (userProfile.role === "admin") {
            await loadPendingResources(user);
        }

        return;
    }

    const uploadForm =
    document.getElementById("resourceUploadForm");

    if (uploadForm) {
        uploadForm.addEventListener("submit", (event) => {
            event.preventDefault();
            uploadResource(user);
        });
    }

    await loadResourceDetails(user);
});
