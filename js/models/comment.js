const COMMENT_MAX_LENGTH = 1000;
const USER_NAME_MAX_LENGTH = 120;

function requiredText(value, fieldName) {
    const cleanValue = typeof value === "string" ? value.trim() : "";
    if (!cleanValue) throw new Error(`${fieldName} is required.`);
    return cleanValue;
}

function normalizeMessage(value) {
    const message = requiredText(value, "Comment");
    if (message.length > COMMENT_MAX_LENGTH) {
        throw new Error(
            `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters.`
        );
    }
    return message;
}

export function createCommentModel(data = {}) {
    const userName = requiredText(data.userName || "Student", "User name");
    return {
        resourceId: requiredText(data.resourceId, "Resource ID"),
        userId: requiredText(data.userId, "User ID"),
        userName: userName.slice(0, USER_NAME_MAX_LENGTH),
        message: normalizeMessage(data.message)
    };
}

export function createCommentUpdateModel(data = {}) {
    return { message: normalizeMessage(data.message) };
}
