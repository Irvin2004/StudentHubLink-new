import { auth, db } from "../firebase.js";

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
            console.log("No financial data found.");
            return;
        }

        const data =
        financialDoc.data();

        document.getElementById("platformRevenue").textContent =
        `R${Number(data.totalRevenue || 0).toFixed(2)}`;

        document.getElementById("totalTransactions").textContent =
        data.totalTransactions || 0;
    } catch (error) {
        console.error("Financials Error:", error);
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
            alert("Access denied.");
            window.location.href = "../dashboard.html";
            return;
        }

        await loadFinancials();
    } catch (error) {
        console.error(error);
        window.location.href = "../dashboard.html";
    }
});
