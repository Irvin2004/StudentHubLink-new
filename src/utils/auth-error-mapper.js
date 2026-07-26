const AUTH_ERROR_MESSAGES = Object.freeze({
    "auth/email-already-in-use":
        "An account with this email address already exists.",
    "auth/invalid-credential":
        "The email address or password you entered is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/missing-password": "Enter your password.",
    "auth/network-request-failed":
        "We could not connect. Check your internet connection and try again.",
    "auth/operation-not-allowed":
        "This sign-in method is currently unavailable.",
    "auth/too-many-requests":
        "Too many attempts were made. Wait a moment and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account was found with that email address.",
    "auth/weak-password":
        "Use a stronger password with at least six characters.",
    "auth/wrong-password": "Incorrect password."
});

const DEFAULT_AUTH_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Converts an authentication provider error into a user-friendly message.
 *
 * @param {{code?: unknown}|null|undefined} error
 * @returns {string}
 */
export function mapAuthError(error) {
    if (typeof error?.code !== "string") {
        return DEFAULT_AUTH_ERROR_MESSAGE;
    }

    return AUTH_ERROR_MESSAGES[error.code] || DEFAULT_AUTH_ERROR_MESSAGE;
}
