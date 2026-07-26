const CONNECTION_CODES = new Set([
    "unavailable",
    "storage/retry-limit-exceeded",
    "storage/unknown"
]);

const CONTEXT_MESSAGES = Object.freeze({
    community:
        "This community may have been removed, or you may no longer have access.",
    channels:
        "Check your connection and try loading the community channels again.",
    files: "Check your connection and retry the file operation.",
    messages:
        "Check your connection. Failed messages can be retried from the conversation.",
    notifications:
        "Notifications could not refresh. Your existing activity is still available.",
    search: "Couldn't search. Check your internet connection and try again."
});

export function getActionableErrorMessage(error, context = "content") {
    const fullCode = String(error?.code || "").toLowerCase();
    const code = fullCode.split("/").at(-1);

    if (CONNECTION_CODES.has(fullCode) || CONNECTION_CODES.has(code)) {
        return "Check your connection and try again.";
    }

    if (
        fullCode.includes("permission-denied") ||
        fullCode.includes("unauthorized")
    ) {
        return "You do not have permission to complete this action.";
    }

    if (fullCode.includes("not-found")) {
        return CONTEXT_MESSAGES[context] || "This item is no longer available.";
    }

    return (
        CONTEXT_MESSAGES[context] ||
        "Please try again. If the problem continues, reload the page."
    );
}
