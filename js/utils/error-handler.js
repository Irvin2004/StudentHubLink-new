import {
    getUserFriendlyErrorMessage,
    handleError as handleAppError
} from "../services/error-service.js";

export { getUserFriendlyErrorMessage };

export function handleError(
    error,
    fallbackMessage = "Something went wrong."
) {
    return handleAppError(error, {
        message: fallbackMessage
    });
}
