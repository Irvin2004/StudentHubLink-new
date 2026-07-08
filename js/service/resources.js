import { app } from "../firebase.js";
import { createActivity } from "./activity.js";
import { createNotification } from "./notifications.js";
import {
    getResourceAction,
    getResourceActionPastTense,
    getReviewStatus,
    RESOURCE_ACTION,
    RESOURCE_STATUS,
    REVIEW_ACTION,
    TRANSACTION_STATUS
} from "../utils/constants.js";
import { formatPrice } from "../utils/formatPrice.js";

import {
    getAuth,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    getFirestore,
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

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const resourceId =
new URLSearchParams(window.location.search).get("id");

const setText = (id, value) => {
    const element =
    document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
};

const escapeHtml = (value) =>
String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

function resourceCard(resource) {
    const action =
    getResourceAction(resource);

    const priceClass =
    action === RESOURCE_ACTION.PURCHASE ? "buy-btn" : "download-btn";

    const actionText =
    action === RESOURCE_ACTION.PURCHASE ? "View Purchase" : "View Download";

    return `
        <div class="resource-card">
            <h3>${escapeHtml(resource.title)}</h3>
            <p>${escapeHtml(resource.description)}</p>
            <p>${escapeHtml(resource.category)}</p>
            <div class="price">${formatPrice(resource.price)}</div>

            <div class="actions">
                <a class="${priceClass}" href="resource_details.html?id=${resource.id}">
                    ${actionText}
                </a>
            </div>
        </div>
    `;
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
            ownerName: userProfile.name || userProfile.fullName || user.displayName || "Student",
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
            await createActivity(
                user.uid,
                "upload",
                "Resource uploaded",
                `${title} was uploaded for admin approval.`,
                "upload"
            );
        } catch (error) {
            console.error("Upload activity failed:", error);
        }

        message.textContent = "Resource uploaded for admin approval.";
        document.getElementById("resourceUploadForm").reset();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        uploadBtn.disabled = false;
    }
}

async function loadResourcesPage() {
    const grid =
    document.getElementById("resourcesGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "<p>Loading resources...</p>";

    try {
        const resourcesQuery =
        query(collection(db, "resources"), where("approved", "==", true));

        const snapshot =
        await getDocs(resourcesQuery);

        const resources = [];

        snapshot.forEach((item) => {
            resources.push({
                id: item.id,
                ...item.data()
            });
        });

        const searchInput =
        document.getElementById("resourceSearch");

        const categoryButtons =
        document.querySelectorAll(".category");

        let selectedCategory = "All";

        const render = () => {
            const search =
            searchInput.value.trim().toLowerCase();

            const filteredResources =
            resources.filter((resource) => {
                const searchText =
                `${resource.title} ${resource.description} ${resource.category}`.toLowerCase();

                const matchesSearch =
                searchText.includes(search);

                const matchesCategory =
                selectedCategory === "All" || resource.category === selectedCategory;

                return matchesSearch && matchesCategory;
            });

            grid.innerHTML =
            filteredResources.length > 0 ?
            filteredResources.map(resourceCard).join("") :
            "<p>No approved resources found.</p>";
        };

        searchInput.addEventListener("input", render);

        categoryButtons.forEach((button) => {
            button.addEventListener("click", () => {
                selectedCategory =
                button.textContent.trim();

                categoryButtons.forEach((item) => {
                    item.classList.remove("active");
                });

                button.classList.add("active");
                render();
            });
        });

        render();
    } catch (error) {
        grid.innerHTML = `<p>${error.message}</p>`;
    }
}

function calculateCommission(amount) {

    return {

        sellerAmount: amount * 0.80,

        platformCommission: amount * 0.20

    };

}

async function createTransaction(user, resource, type) {
    const amount =
    type === RESOURCE_ACTION.PURCHASE ? Number(resource.price || 0) : 0;
    const commission =
    calculateCommission(amount);

    await addDoc(collection(db, "transactions"), {
        buyerId: user.uid,
        sellerId: resource.ownerId,
        resourceId: resource.id,
        amount,
        createdAt: serverTimestamp(),
        resourceTitle: resource.title,
        buyerEmail: user.email,
        sellerEmail: resource.ownerEmail || "",
        type,
        sellerAmount:
        commission.sellerAmount,
        platformCommission:
        commission.platformCommission,
        currency: "ZAR",
        status: TRANSACTION_STATUS.COMPLETED
    });

    await updateDoc(doc(db, "resources", resource.id), {
        downloadCount: increment(1),
        purchaseCount: type === RESOURCE_ACTION.PURCHASE ? increment(1) : increment(0),
        updatedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "users", user.uid), {
        totalDownloads: increment(1),
        updatedAt: serverTimestamp()
    });

    await createActivity(
        user.uid,
        type,
        type === RESOURCE_ACTION.PURCHASE ? "Resource purchased" : "Resource downloaded",
        `${resource.title} was ${getResourceActionPastTense(type)}.`
    );

    if (type === RESOURCE_ACTION.PURCHASE && resource.ownerId) {
        await updateDoc(doc(db, "users", resource.ownerId), {
            totalEarnings: increment(commission.sellerAmount),
            updatedAt: serverTimestamp()
        });

        await createActivity(
            resource.ownerId,
            "sale",
            "Resource sold",
            `${resource.title} earned ${formatPrice(commission.sellerAmount)}.`
        );

        await createNotification(
            resource.ownerId,
            "Resource purchased",
            `${user.email} purchased ${resource.title}.`
        );

    await setDoc(doc(db, "platform", "financials"), {
        totalRevenue: increment( commission.platformCommission ),
        totalTransactions: increment(1),
        updatedAt: serverTimestamp()
    },
    { merge: true }
);
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
            await createTransaction(user, resource, type);
            window.open(resource.fileUrl, "_blank");
            actionBtn.textContent = "Downloaded";
        } catch (error) {
            alert(error.message);
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

        await createActivity(
            reviewedResource?.ownerId,
            approved ? "approval" : "rejection",
            approved ? "Resource approved" : "Resource rejected",
            approved ?
            `${reviewedResource?.title || "Your resource"} is now available.` :
            `${reviewedResource?.title || "Your resource"} was not approved.`
        );

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

    await loadResourcesPage();
    await loadResourceDetails(user);
});
