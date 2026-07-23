import { auth } from "../../src/firebase/auth.js";
import { db } from "../../src/firebase/firestore.js";
import { formatCurrency } from "../utils/format-price.js";
import { error as logError } from "../utils/logger.js";
import { showToast } from "../services/user-feedback-service.js";

import { onAuthStateChanged } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

async function loadFinancials() {
    try {
        const financialDoc = await getDoc(doc(db, "platform", "financials"));

        if (!financialDoc.exists()) {
            return;
        }

        const data = financialDoc.data();

        document.getElementById("platformRevenue").textContent = formatCurrency(
            data.totalRevenue,
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

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
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists()) {
            window.location.href = "../dashboard.html";
            return;
        }

        const userData = userSnap.data();

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
