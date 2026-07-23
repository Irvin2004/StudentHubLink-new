import { ERROR_TYPES } from "../config/error-types.js";
import {
    showError,
    showInfo,
    showSuccess,
    showWarning
} from "../services/error-service.js";

const DISPLAYERS = Object.freeze({
    [ERROR_TYPES.ERROR]: showError,
    [ERROR_TYPES.INFO]: showInfo,
    [ERROR_TYPES.SUCCESS]: showSuccess,
    [ERROR_TYPES.WARNING]: showWarning
});

export function showToast(
    message,
    type = ERROR_TYPES.SUCCESS,
    title = ""
) {
    const display = DISPLAYERS[type] || showInfo;

    return display({
        title,
        message
    });
}
