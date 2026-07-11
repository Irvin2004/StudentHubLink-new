import { error as logError } from "./logger.js";
import { showToast } from "./toast.js";

export function handleError(error, fallbackMessage = "Something went wrong.") {
    logError("APP", fallbackMessage, error);
    showToast(error?.message || fallbackMessage, "error");
}
