import { auth, db } from "./firebase_config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";
        return;
    }

    try {

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            window.location.href = "../dashboard.html";
            return;
        }

        const userData = userSnap.data();

        if (userData.role !== "admin") {

            alert("Access denied.");

            window.location.href = "../dashboard.html";
            return;
        }

        console.log("Admin authenticated");

    } catch (error) {

        console.error(error);

        window.location.href = "../dashboard.html";
    }

});
