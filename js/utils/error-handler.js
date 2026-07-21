import { error as logError } from "./logger.js";
import { showToast } from "./toast.js";

const FRIENDLY_ERROR_MESSAGES = Object.freeze({
    "permission-denied":
        "You don't have permission to perform this action.",
    unauthenticated:
        "Please sign in and try again.",
    unavailable:
        "The service is temporarily unavailable. Please try again in a moment.",
    "deadline-exceeded":
        "The request took too long. Please try again.",
    "resource-exhausted":
        "The service is busy right now. Please try again in a moment.",
    "not-found":
        "The resource you're looking for couldn't be found.",
    "already-exists":
        "That item already exists.",
    "auth/network-request-failed":
        "Check your internet connection and try again.",
    "auth/invalid-email":
        "Enter a valid email address.",
    "auth/too-many-requests":
        "Too many attempts. Wait a moment and try again.",
    "auth/weak-password":
        "Use a stronger password with at least 8 characters.",
    "auth/email-already-in-use":
        "An account already exists for that email address.",
    "auth/requires-recent-login":
        "Please sign in again before continuing.",
    "storage/unauthorized":
        "You don't have permission to access this file.",
    "storage/object-not-found":
        "The requested file could not be found.",
    "storage/retry-limit-exceeded":
        "The upload took too long. Please try again.",
    "storage/quota-exceeded":
        "File uploads are temporarily unavailable."
});

export function getUserFriendlyErrorMessage(
    error,
    fallbackMessage = "Something went wrong."
) {
    const code = String(error?.code || "")
        .replace(/^firestore\//, "");

    if (FRIENDLY_ERROR_MESSAGES[code]) {
        return FRIENDLY_ERROR_MESSAGES[code];
    }

    if (!code && error?.message) {
        return error.message;
    }

    return fallbackMessage;
}

export function handleError(error, fallbackMessage = "Something went wrong.") {
    logError("APP", fallbackMessage, error);
    showToast(
        getUserFriendlyErrorMessage(error, fallbackMessage),
        "error"
    );
}
