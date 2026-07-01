import { app } from "./firebase_config.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    getFirestore,
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

const auth = getAuth(app);
const db = getFirestore(app);

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

const isAdminPage =
currentPath.includes("/Admin/");

const formatCurrency = (value) =>
`R${Number(value || 0).toLocaleString("en-ZA")}`;

const formatDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

    return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

async function getUserDocument(user) {
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
        console.warn("Could not update last login:", error);
    }
}

function setText(id, value) {
    const element =
    document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setMessage(id, value, type = "") {
    const element =
    document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = value;
    element.classList.remove("error", "success");

    if (type) {
        element.classList.add(type);
    }
}

function setButtonLoading(button, isLoading, loadingText) {
    if (!button) {
        return;
    }

    if (!button.dataset.defaultText) {
        button.dataset.defaultText =
        button.textContent.trim();
    }

    button.disabled = isLoading;
    button.textContent =
    isLoading ? loadingText : button.dataset.defaultText;
}
function redirectToDashboard() {
    window.location.href = "dashboard.html";
}

async function loadUserStats(user, userData) {
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
        console.warn("Could not load upload count:", error);
    }

    const downloads =
    Number(userData.totalDownloads || 0);

    const earnings =
    Number(userData.totalEarnings || 0);

    setText("dashboardDownloads", downloads);
    setText("dashboardUploads", uploadCount);
    setText("dashboardEarnings", formatCurrency(earnings));

    setText("profileDownloads", downloads);
    setText("profileUploads", uploadCount);
    setText("profileEarnings", formatCurrency(earnings));
}

function renderUserProfile(userData) {
    setText("userName", userData.fullName || "Student");
    setText("userEmail", userData.email || "");
    setText("profileMemberSince", `Member since ${formatDate(userData.createdAt)}`);
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
    query(collection(db, "resources"), where("status", "==", "pending"));

    const pendingSnapshot =
    await getCountFromServer(pendingQuery);

    const transactionsQuery =
    query(collection(db, "transactions"), where("status", "==", "completed"));

    const completedTransactions =
    await getDocs(transactionsQuery);

    let revenue = 0;

    completedTransactions.forEach((transaction) => {
        const data =
        transaction.data();

        revenue += Number(data.amountPaid || data.amount || 0);
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
                
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            });
            setMessage(
            "registerMessage",
            "Account created successfully. Opening dashboard...",
            "success"
            );

            window.location.href = "dashboard.html";
                     
        } catch (error) {
            console.warn("Account was created, but the profile could not be saved:", error);
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

const logoutBtn =
document.getElementById("logoutBtn");

if (logoutBtn) {
logoutBtn.addEventListener("click", async (event) => {

    event.preventDefault();

    await signOut(auth);

    window.location.href =
    pagePrefix + "login.html";

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

    let userData;

    try {
        userData =
        await getUserDocument(user);
    } catch (error) {
        console.error("Could not load user profile:", error);

        userData = {
            fullName: user.displayName || "Student",
            email: user.email,
            role: "student",
            totalUploads: 0,
            totalDownloads: 0,
            totalEarnings: 0
        };
    }

    if (isAdminPage && userData.role !== "admin") {
        alert("Admin access only.");
        window.location.href =
        pagePrefix + "dashboard.html";
        return;
    }

    renderUserProfile(userData);
    await loadUserStats(user, userData);

    if (isAdminPage) {
        await loadAdminStats();
    }

});
