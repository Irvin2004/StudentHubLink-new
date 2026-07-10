import { auth, db } from "../firebase.js";
import { formatCurrency } from "../utils/formatPrice.js";
import { error as logError } from "../utils/logger.js";
import { showToast } from "../utils/toast.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function loadFinancials() {
    try {
        const financialDoc =
        await getDoc(doc(db, "platform", "financials"));

        if (!financialDoc.exists()) {
            return;
        }

        const data =
        financialDoc.data();

        document.getElementById("platformRevenue").textContent =
        formatCurrency(data.totalRevenue, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        document.getElementById("totalTransactions").textContent =
        data.totalTransactions || 0;
    } catch (error) {
        logError("FIRESTORE", "Financials Error:", error);
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    try {
        const userSnap =
        await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists()) {
            window.location.href = "../dashboard.html";
            return;
        }

        const userData =
        userSnap.data();

        if (userData.role !== "admin") {
            showToast("Access denied.", "warning");
            window.location.href = "../dashboard.html";
            return;
        }

        await loadFinancials();
    } catch (error) {
        logError("AUTH", error);
        window.location.href = "../dashboard.html";
    }
});
