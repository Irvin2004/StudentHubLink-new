import { addActivity } from "./activity.js";
import { createNotification } from "./notifications.js";
import { addToLibrary } from "./library.js";
import { db } from "../firebase.js";
import {
    getResourceAction,
    getResourceActionPastTense,
    RESOURCE_ACTION,
    TRANSACTION_STATUS
} from "../utils/constants.js";
import { formatPrice } from "../utils/formatPrice.js";

import {
    addDoc,
    collection,
    doc,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function calculateCommission(amount) {
    return {
        sellerAmount: amount * 0.80,
        platformCommission: amount * 0.20
    };
}

async function recordResourceTransaction(resource, user, action) {
    const amount =
    action === RESOURCE_ACTION.PURCHASE ? Number(resource.price || 0) : 0;

    const commission =
    calculateCommission(amount);

    await addDoc(collection(db, "transactions"), {
        buyerId: user.uid,
        sellerId: resource.ownerId || "",
        resourceId: resource.id,
        amount,
        createdAt: serverTimestamp(),
        resourceTitle: resource.title,
        buyerEmail: user.email,
        sellerEmail: resource.ownerEmail || "",
        type: action,
        sellerAmount: commission.sellerAmount,
        platformCommission: commission.platformCommission,
        currency: "ZAR",
        status: TRANSACTION_STATUS.COMPLETED
    });

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        totalDownloads: increment(1),
        updatedAt: serverTimestamp()
    }, {
        merge: true
    });

    if (action !== RESOURCE_ACTION.PURCHASE || !resource.ownerId) {
        return commission;
    }

    await setDoc(doc(db, "users", resource.ownerId), {
        totalEarnings: increment(commission.sellerAmount),
        updatedAt: serverTimestamp()
    }, {
        merge: true
    });

    await setDoc(doc(db, "platform", "financials"), {
        totalRevenue: increment(commission.platformCommission),
        totalTransactions: increment(1),
        updatedAt: serverTimestamp()
    }, {
        merge: true
    });

    return commission;
}

export async function incrementDownload(resourceId, action = RESOURCE_ACTION.DOWNLOAD) {
    if (!resourceId) {
        return;
    }

    const resourceUpdate = {
        downloadCount: increment(1),
        updatedAt: serverTimestamp()
    };

    if (action === RESOURCE_ACTION.PURCHASE) {
        resourceUpdate.purchaseCount = increment(1);
    }

    await updateDoc(doc(db, "resources", resourceId), resourceUpdate);
}

export async function handleResourceAction(resource, user) {

    if (!resource || !user) return;

    const action =
        getResourceAction(resource);

    const commission =
        await recordResourceTransaction(resource, user, action);

    await incrementDownload(resource.id, action);

    await addToLibrary(resource, user, action);

    await addActivity({

        userId: user.uid,

        type: action,

        title:
            action === RESOURCE_ACTION.PURCHASE
                ? "Resource purchased"
                : "Resource downloaded",

        description: `${resource.title} was ${getResourceActionPastTense(action)}.`,
        resourceId: resource.id,
        ownerId: resource.ownerId || "",
        ownerName: resource.ownerName || "Unknown Author",

        icon:
            action === RESOURCE_ACTION.PURCHASE
                ? "sale"
                : "download"

    });

    await createNotification({

        userId: user.uid,

        title:
            action === RESOURCE_ACTION.PURCHASE
                ? "Purchase successful"
                : "Download ready",

        message:
            action === RESOURCE_ACTION.PURCHASE
                ? `${resource.title} has been added to your library.`
                : `${resource.title} is ready for download.`

    });

    if (action === RESOURCE_ACTION.PURCHASE && resource.ownerId) {
        await addActivity({
            userId: resource.ownerId,
            type: "sale",
            title: "Resource sold",
            description: `${resource.title} earned ${formatPrice(commission.sellerAmount)}.`,
            icon: "sale",
            resourceId: resource.id,
            ownerId: resource.ownerId || "",
            ownerName: resource.ownerName || "Unknown Author"
        });

        await createNotification({
            userId: resource.ownerId,
            title: "Resource purchased",
            message: `${user.email} purchased ${resource.title}.`
        });
    }

    return {
        action,
        commission
    };
    
}
