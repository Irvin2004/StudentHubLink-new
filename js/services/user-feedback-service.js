"use strict";

import { ERROR_TYPES } from "../config/error-types.js";
import {
    getUserFriendlyErrorMessage,
    handleError as handleAppError,
    showError,
    showInfo,
    showSuccess,
    showWarning
} from "./error-service.js";

const DISPLAYERS = Object.freeze({
    [ERROR_TYPES.ERROR]: showError,
    [ERROR_TYPES.INFO]: showInfo,
    [ERROR_TYPES.SUCCESS]: showSuccess,
    [ERROR_TYPES.WARNING]: showWarning
});

export { getUserFriendlyErrorMessage };

/**
 * Presents a normalized application error with a fallback message.
 *
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @returns {object}
 */
export function handleError(
    error,
    fallbackMessage = "Something went wrong."
) {
    return handleAppError(error, {
        message: fallbackMessage
    });
}

/**
 * Displays a user-facing toast through the centralized error service.
 *
 * @param {string} message
 * @param {string} type
 * @param {string} title
 * @returns {object}
 */
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
