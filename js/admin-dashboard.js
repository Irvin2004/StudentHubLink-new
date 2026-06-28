import { db } from "./firebase_config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function loadFinancials() {

    try {

        const financialDoc =
        await getDoc(
            doc(db, "platform", "financials")
        );

        if (!financialDoc.exists()) {

            console.log(
                "No financial data found."
            );

            return;
        }

        const data =
        financialDoc.data();

        document.getElementById(
            "platformRevenue"
        ).textContent =
        `R${Number(
            data.totalRevenue || 0
        ).toFixed(2)}`;

        document.getElementById(
            "totalTransactions"
        ).textContent =
        data.totalTransactions || 0;

    }

    catch(error){

        console.error(
            "Financials Error:",
            error
        );

    }

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadFinancials();

    }
);
