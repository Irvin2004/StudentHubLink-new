import { auth, db } from "../firebase.js";
import {
    addActivity
} from "./activity.js";
import { RESOURCE_STATUS, TRANSACTION_STATUS } from "../utils/constants.js";
import {
    setButtonLoading,
    setMessage,
    setText
} from "../utils/dom.js";
import { formatLongDate } from "../utils/formatDate.js";
import { formatCurrency } from "../utils/formatPrice.js";
import { error as logError, warn } from "../utils/logger.js";
import { showToast } from "../utils/toast.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    getCountFromServer,
    serverTimestamp
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const pagePrefix =
window.location.pathname.includes("/pages/") ||
window.location.pathname.includes("/Admin/") ? "../" : "";

const publicPages = [
    "/index.html",
    "/login.html",
    "/register.html",
    "/"
];

const currentPath =
window.location.pathname;

const isPublicPage =
publicPages.some((page) => currentPath.endsWith(page));

const isDashboardPage =
currentPath.endsWith("/dashboard.html");

const isAdminPage =
currentPath.includes("/Admin/");

export async function getUserDocument(user) {
    const userRef =
    doc(db, "users", user.uid);

    const snapshot =
    await getDoc(userRef);

    if (snapshot.exists()) {
        return {
            id: snapshot.id,
            ...snapshot.data()
        };
    }

    const fallbackProfile = {
        uid: user.uid,
        name: user.displayName || "Student",
        fullName: user.displayName || "Student",
        email: user.email,
        role: "student",
        institution: "",
        course: "",
        yearOfStudy: "",
        bio: "",
        totalUploads: 0,
        totalDownloads: 0,
        totalEarnings: 0,
        joinedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(userRef, fallbackProfile);

    return fallbackProfile;
}

async function updateLastLogin(user) {
    try {
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, {
            merge: true
        });
    } catch (error) {
        warn("AUTH", "Could not update last login:", error);
    }
}

function redirectToDashboard() {
    window.location.href = "dashboard.html";
}

async function loadProfileStats(user, userData) {
    let uploadCount =
    Number(userData.totalUploads || 0);

    try {
        const uploadQuery =
        query(collection(db, "resources"), where("ownerId", "==", user.uid));

        const uploadSnapshot =
        await getCountFromServer(uploadQuery);

        uploadCount =
        uploadSnapshot.data().count;
    } catch (error) {
        warn("FIRESTORE", "Could not load upload count:", error);
    }

    const downloads =
    Number(userData.totalDownloads || 0);

    const earnings =
    Number(userData.totalEarnings || 0);

    setText("profileDownloads", downloads);
    setText("profileUploads", uploadCount);
    setText("profileEarnings", formatCurrency(earnings));
}

function renderUserProfile(userData) {
    const displayName =
    userData.name || userData.fullName || "Student";

    setText("userName", displayName);
    setText("userEmail", userData.email || "");
    setText("profileMemberSince", `Member since ${formatLongDate(userData.joinedAt || userData.createdAt)}`);
    setText("profileRole", userData.role || "student");
    setText("profileInstitution", userData.institution || "Not added yet");
    setText("profileCourse", userData.course || "Not added yet");
    setText("profileYear", userData.yearOfStudy || "Not added yet");
    setText("profileBio", userData.bio || "No bio added yet.");
}

async function loadAdminStats() {
    const usersSnapshot =
    await getCountFromServer(collection(db, "users"));

    const resourcesSnapshot =
    await getCountFromServer(collection(db, "resources"));

    const pendingQuery =
    query(collection(db, "resources"), where("status", "==", RESOURCE_STATUS.PENDING));

    const pendingSnapshot =
    await getCountFromServer(pendingQuery);

    const transactionsQuery =
    query(collection(db, "transactions"), where("status", "==", TRANSACTION_STATUS.COMPLETED));

    const completedTransactions =
    await getDocs(transactionsQuery);

    let revenue = 0;

    completedTransactions.forEach((transaction) => {
        const data =
        transaction.data();

        revenue += Number(data.amount || data.amountPaid || 0);
    });

    setText("adminTotalUsers", usersSnapshot.data().count);
    setText("adminUploadedNotes", resourcesSnapshot.data().count);
    setText("adminPendingReviews", pendingSnapshot.data().count);
    setText("adminTotalRevenue", formatCurrency(revenue));
}

const registerForm =
document.getElementById("registerForm");

if (registerForm) {
registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const registerBtn =
    document.getElementById("registerBtn");

    setButtonLoading(registerBtn, true, "Creating account...");
    setMessage("registerMessage", "Creating your account...");

    const fullName =
    document.getElementById("fullName").value.trim();

    const email =
    document.getElementById("registerEmail").value.trim();

    const password =
    document.getElementById("registerPassword").value;

    try {

        const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        if (fullName) {
            await updateProfile(userCredential.user, {
                displayName: fullName
            });
        }

        try {
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: fullName,
                fullName: fullName,
                displayName: fullName,
                email: userCredential.user.email,
                role: "student",
                photoURL: "",
                institution: "",
                course: "",
                yearOfStudy: "",
                bio: "",

                totalUploads: 0,
                totalDownloads: 0,
                totalEarnings: 0,
                
                joinedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            });

            await addActivity({
                userId: userCredential.user.uid,
                type: "register",
                title: "Welcome to StudentHub",
                description: "Your account was created successfully.",
                icon: "user-plus"
            });   
            
            setMessage(
            "registerMessage",
            "Account created successfully. Opening dashboard...",
            "success"
            );

        } catch (error) {
            warn("FIRESTORE", "Account was created, but the profile could not be saved:", error);
        }

        setMessage("registerMessage", "Account created. Opening dashboard...", "success");

        redirectToDashboard();

    } catch(error){

        setMessage("registerMessage", error.message, "error");
        setButtonLoading(registerBtn, false);

    }

});
}

const loginForm =
document.getElementById("loginForm");

if (loginForm) {
loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const loginBtn =
    document.getElementById("loginBtn");

    setButtonLoading(loginBtn, true, "Logging in...");
    setMessage("loginMessage", "Checking your details...");

    const email =
    document.getElementById("loginEmail").value.trim();

    const password =
    document.getElementById("loginPassword").value;

    try {

        const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        setMessage("loginMessage", "Login successful. Opening dashboard...", "success");

        window.location.href = "dashboard.html";

        updateLastLogin(userCredential.user);

    } catch(error) {

        setMessage("loginMessage", error.message, "error");
        setButtonLoading(loginBtn, false);

    }

});
}

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        if (!isPublicPage) {
            window.location.href =
            pagePrefix + "login.html";
        }
        return;
    }

    if (isPublicPage) {
        return;
    }

    if (isDashboardPage) {
        return;
    }

    let userData;

    try {
        userData =
        await getUserDocument(user);
    } catch (error) {
        logError("AUTH", "Could not load user profile:", error);

        userData = {
            name: user.displayName || "Student",
            fullName: user.displayName || "Student",
            email: user.email,
            role: "student",
            totalUploads: 0,
            totalDownloads: 0,
            totalEarnings: 0
        };
    }

    if (isAdminPage && userData.role !== "admin") {
        showToast("Admin access only.", "warning");
        window.location.href =
        pagePrefix + "dashboard.html";
        return;
    }

    renderUserProfile(userData);
    await loadProfileStats(user, userData);

    if (isAdminPage) {
        await loadAdminStats();
    }

});
