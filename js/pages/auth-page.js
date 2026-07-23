import { auth } from "../../src/firebase/auth.js";
import { db } from "../../src/firebase/firestore.js";
import { RESOURCE_STATUS, TRANSACTION_STATUS } from "../utils/constants.js";
import { setButtonLoading, setMessage, setText } from "../utils/dom.js";
import { formatLongDate } from "../utils/format-date.js";
import { formatCurrency } from "../utils/format-price.js";
import { getUserFriendlyErrorMessage } from "../services/user-feedback-service.js";
import { error as logError, warn } from "../utils/logger.js";
import { showToast } from "../services/user-feedback-service.js";
import { hideSkeleton, showSkeleton } from "../renderers/skeleton-renderer.js";
import { SKELETON_TYPES } from "../config/skeleton-types.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "firebase/auth";

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
} from "firebase/firestore";

const pagePrefix =
    window.location.pathname.includes("/pages/") ||
    window.location.pathname.includes("/Admin/")
        ? "../"
        : "";

const publicPages = ["/index.html", "/login.html", "/register.html", "/"];

const currentPath = window.location.pathname;

const isPublicPage = publicPages.some((page) => currentPath.endsWith(page));

const isDashboardPage = currentPath.endsWith("/dashboard.html");

const isProfilePage = currentPath.endsWith("/pages/profile.html");

const isAdminPage = currentPath.includes("/Admin/");

const profileSummaryLoading = document.getElementById("profileSummaryLoading");

if (isProfilePage && profileSummaryLoading) {
    showSkeleton(profileSummaryLoading, SKELETON_TYPES.PROFILE);
}

export async function getUserDocument(user) {
    const userRef = doc(db, "users", user.uid);

    const snapshot = await getDoc(userRef);

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
        profileVisibility: "public",
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
        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,
                email: user.email,
                lastLoginAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );
    } catch (error) {
        warn("AUTH", "Could not update last login:", error);
    }
}

function redirectToDashboard() {
    window.location.href = "dashboard.html";
}

async function loadProfileStats(user, userData) {
    let uploadCount = Number(userData.totalUploads || 0);

    try {
        const uploadQuery = query(
            collection(db, "resources"),
            where("ownerId", "==", user.uid)
        );

        const uploadSnapshot = await getCountFromServer(uploadQuery);

        uploadCount = uploadSnapshot.data().count;
    } catch (error) {
        warn("FIRESTORE", "Could not load upload count:", error);
    }

    const downloads = Number(userData.totalDownloads || 0);

    const earnings = Number(userData.totalEarnings || 0);

    setText("profileDownloads", downloads);
    setText("profileUploads", uploadCount);
    setText("profileEarnings", formatCurrency(earnings));
}

function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input) input.value = value || "";
}

function renderUserProfile(userData, user) {
    const displayName = userData.name || userData.fullName || "Student";

    setText("userName", displayName);
    setText("userEmail", userData.email || "");
    setText(
        "profileMemberSince",
        `Member since ${formatLongDate(userData.joinedAt || userData.createdAt)}`
    );
    setText("profileRole", userData.role || "student");
    setText("profileInstitution", userData.institution || "Not added yet");
    setText("profileCourse", userData.course || "Not added yet");
    setText("profileYear", userData.yearOfStudy || "Not added yet");
    setText("profileBio", userData.bio || "No bio added yet.");
    setText(
        "profileVerification",
        user?.emailVerified ? "Email verified" : "Email not verified"
    );

    const resendButton = document.getElementById("resendVerificationBtn");
    if (resendButton) resendButton.hidden = Boolean(user?.emailVerified);

    setInputValue("profileFullName", displayName);
    setInputValue("profileInstitutionInput", userData.institution);
    setInputValue("profileCourseInput", userData.course);
    setInputValue("profileYearInput", userData.yearOfStudy);
    setInputValue("profileBioInput", userData.bio);

    if (profileSummaryLoading) {
        hideSkeleton(profileSummaryLoading);
        profileSummaryLoading.hidden = true;
    }

    const profileSummaryContent = document.getElementById(
        "profileSummaryContent"
    );

    if (profileSummaryContent) {
        profileSummaryContent.hidden = false;
    }
}

function bindProfileActions(user, userData) {
    const profileForm = document.getElementById("profileForm");
    const saveButton = document.getElementById("saveProfileBtn");
    const resendButton = document.getElementById("resendVerificationBtn");

    if (profileForm) {
        profileForm.onsubmit = async (event) => {
            event.preventDefault();

            const fullName = document
                .getElementById("profileFullName")
                .value.trim();
            const institution = document
                .getElementById("profileInstitutionInput")
                .value.trim();
            const course = document
                .getElementById("profileCourseInput")
                .value.trim();
            const yearOfStudy = document
                .getElementById("profileYearInput")
                .value.trim();
            const bio = document.getElementById("profileBioInput").value.trim();

            if (!fullName) {
                setMessage(
                    "profileMessage",
                    "Please enter your full name.",
                    "error"
                );
                return;
            }

            setButtonLoading(saveButton, true, "Saving profile...");
            setMessage("profileMessage", "Saving your changes...");

            try {
                await updateProfile(user, { displayName: fullName });
                await setDoc(
                    doc(db, "users", user.uid),
                    {
                        name: fullName,
                        fullName,
                        displayName: fullName,
                        institution,
                        course,
                        yearOfStudy,
                        bio,
                        updatedAt: serverTimestamp()
                    },
                    { merge: true }
                );

                Object.assign(userData, {
                    name: fullName,
                    fullName,
                    displayName: fullName,
                    institution,
                    course,
                    yearOfStudy,
                    bio
                });
                renderUserProfile(userData, user);
                setMessage(
                    "profileMessage",
                    "Profile updated successfully.",
                    "success"
                );
            } catch (error) {
                logError("AUTH", "Profile update failed.", error);
                setMessage(
                    "profileMessage",
                    getUserFriendlyErrorMessage(
                        error,
                        "Unable to update your profile."
                    ),
                    "error"
                );
            } finally {
                setButtonLoading(saveButton, false);
            }
        };
    }

    if (resendButton) {
        resendButton.onclick = async () => {
            setButtonLoading(resendButton, true, "Sending...");
            setMessage("profileMessage", "Sending verification email...");

            try {
                await sendEmailVerification(user);
                setMessage(
                    "profileMessage",
                    "Verification email sent. Check your inbox and spam folder.",
                    "success"
                );
            } catch (error) {
                logError("AUTH", "Verification email failed.", error);
                setMessage(
                    "profileMessage",
                    getUserFriendlyErrorMessage(
                        error,
                        "Unable to send a verification email."
                    ),
                    "error"
                );
            } finally {
                setButtonLoading(resendButton, false);
            }
        };
    }
}

async function loadAdminStats() {
    const usersSnapshot = await getCountFromServer(collection(db, "users"));

    const resourcesSnapshot = await getCountFromServer(
        collection(db, "resources")
    );

    const pendingQuery = query(
        collection(db, "resources"),
        where("status", "==", RESOURCE_STATUS.PENDING)
    );

    const pendingSnapshot = await getCountFromServer(pendingQuery);

    const transactionsQuery = query(
        collection(db, "transactions"),
        where("status", "==", TRANSACTION_STATUS.COMPLETED)
    );

    const completedTransactions = await getDocs(transactionsQuery);

    let revenue = 0;

    completedTransactions.forEach((transaction) => {
        const data = transaction.data();

        revenue += Number(data.amount || data.amountPaid || 0);
    });

    setText("adminTotalUsers", usersSnapshot.data().count);
    setText("adminUploadedNotes", resourcesSnapshot.data().count);
    setText("adminPendingReviews", pendingSnapshot.data().count);
    setText("adminTotalRevenue", formatCurrency(revenue));
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const registerBtn = document.getElementById("registerBtn");

        setButtonLoading(registerBtn, true, "Creating account...");
        setMessage("registerMessage", "Creating your account...");

        const fullName = document.getElementById("fullName").value.trim();

        const email = document.getElementById("registerEmail").value.trim();

        const password = document.getElementById("registerPassword").value;

        try {
            const userCredential = await createUserWithEmailAndPassword(
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
                await sendEmailVerification(userCredential.user);
            } catch (error) {
                warn(
                    "AUTH",
                    "Account created, but verification email could not be sent:",
                    error
                );
            }

            try {
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    name: fullName,
                    fullName: fullName,
                    displayName: fullName,
                    email: userCredential.user.email,
                    role: "student",
                    profileVisibility: "public",
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

                setMessage(
                    "registerMessage",
                    "Account created successfully. Opening dashboard...",
                    "success"
                );
            } catch (error) {
                warn(
                    "FIRESTORE",
                    "Account was created, but the profile could not be saved:",
                    error
                );
            }

            setMessage(
                "registerMessage",
                "Account created. Opening dashboard...",
                "success"
            );

            redirectToDashboard();
        } catch (error) {
            logError("AUTH", "Registration failed.", error);
            setMessage(
                "registerMessage",
                getUserFriendlyErrorMessage(
                    error,
                    "Unable to create your account. Please try again."
                ),
                "error"
            );
            setButtonLoading(registerBtn, false);
        }
    });
}

const resetPasswordButton = document.getElementById("resetPasswordBtn");

if (resetPasswordButton) {
    resetPasswordButton.addEventListener("click", async () => {
        const email = document.getElementById("loginEmail").value.trim();

        if (!email) {
            setMessage(
                "loginMessage",
                "Enter your email address first.",
                "error"
            );
            document.getElementById("loginEmail").focus();
            return;
        }

        setButtonLoading(resetPasswordButton, true, "Sending reset link...");
        setMessage("loginMessage", "Requesting a password reset...");

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage(
                "loginMessage",
                "If an account exists for that email, a password reset link has been sent.",
                "success"
            );
        } catch (error) {
            if (error?.code === "auth/user-not-found") {
                setMessage(
                    "loginMessage",
                    "If an account exists for that email, a password reset link has been sent.",
                    "success"
                );
                return;
            }

            logError("AUTH", "Password reset failed.", error);
            setMessage(
                "loginMessage",
                getUserFriendlyErrorMessage(
                    error,
                    "Unable to send a password reset link."
                ),
                "error"
            );
        } finally {
            setButtonLoading(resetPasswordButton, false);
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const loginBtn = document.getElementById("loginBtn");

        setButtonLoading(loginBtn, true, "Logging in...");
        setMessage("loginMessage", "Checking your details...");

        const email = document.getElementById("loginEmail").value.trim();

        const password = document.getElementById("loginPassword").value;

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            setMessage(
                "loginMessage",
                "Login successful. Opening dashboard...",
                "success"
            );

            window.location.href = "dashboard.html";

            updateLastLogin(userCredential.user);
        } catch (error) {
            logError("AUTH", "Sign-in failed.", error);
            setMessage(
                "loginMessage",
                getUserFriendlyErrorMessage(
                    error,
                    "Unable to sign in. Check your details and try again."
                ),
                "error"
            );
            setButtonLoading(loginBtn, false);
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (!isPublicPage) {
            window.location.href = pagePrefix + "login.html";
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
        userData = await getUserDocument(user);
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
        window.location.href = pagePrefix + "dashboard.html";
        return;
    }

    renderUserProfile(userData, user);
    bindProfileActions(user, userData);
    await loadProfileStats(user, userData);

    if (isAdminPage) {
        await loadAdminStats();
    }
});
