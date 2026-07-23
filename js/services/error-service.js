"use strict";

import { ALLOWED_ERROR_TYPES, ERROR_TYPES } from "../config/error-types.js";
import { AppError } from "../models/app-error.js";
import { createToast } from "../components/toast.js";
import { error as writeErrorLog } from "../utils/logger.js";
import { DEBUG } from "../config/debug.js";

const FRIENDLY_ERROR_MESSAGES = Object.freeze({
    "permission-denied": "You don't have permission to perform this action.",
    unauthenticated: "Please sign in and try again.",
    unavailable:
        "The service is temporarily unavailable. Please try again shortly.",
    "deadline-exceeded": "The request took too long. Please try again.",
    "resource-exhausted":
        "The service is busy right now. Please try again shortly.",
    "not-found": "The requested item could not be found.",
    "already-exists": "That item already exists.",
    "auth/network-request-failed":
        "Check your internet connection and try again.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/weak-password": "Use a stronger password with at least 8 characters.",
    "auth/email-already-in-use":
        "An account already exists for that email address.",
    "auth/requires-recent-login": "Please sign in again before continuing.",
    "storage/unauthorized": "You don't have permission to access this file.",
    "storage/object-not-found": "The requested file could not be found.",
    "storage/retry-limit-exceeded":
        "The upload took too long. Please try again.",
    "storage/quota-exceeded": "File uploads are temporarily unavailable."
});

const DEFAULT_TITLES = Object.freeze({
    [ERROR_TYPES.SUCCESS]: "Success",
    [ERROR_TYPES.WARNING]: "Please note",
    [ERROR_TYPES.INFO]: "Information",
    [ERROR_TYPES.ERROR]: "Something went wrong"
});

let errorSequence = 0;

function cleanText(value) {
    return String(value || "").trim();
}

export function getUserFriendlyErrorMessage(
    error,
    fallbackMessage = "Something went wrong."
) {
    const code = cleanText(error?.code).replace(/^firestore\//, "");

    if (FRIENDLY_ERROR_MESSAGES[code]) {
        return FRIENDLY_ERROR_MESSAGES[code];
    }

    if (error instanceof AppError) {
        return cleanText(error.message);
    }

    return cleanText(fallbackMessage) || "Something went wrong.";
}

export function normalizeError({
    type = ERROR_TYPES.INFO,
    title,
    message,
    duration,
    code = "",
    error = null,
    timestamp = Date.now()
} = {}) {
    const normalizedType = ALLOWED_ERROR_TYPES.includes(type)
        ? type
        : ERROR_TYPES.ERROR;
    const normalizedMessage =
        normalizedType === ERROR_TYPES.ERROR
            ? getUserFriendlyErrorMessage(error, message)
            : cleanText(message);

    if (!normalizedMessage) {
        throw new Error("A notification message is required.");
    }

    errorSequence += 1;

    return Object.freeze({
        id: `studenthub-notice-${errorSequence}`,
        type: normalizedType,
        title: cleanText(title) || DEFAULT_TITLES[normalizedType],
        message: normalizedMessage,
        duration:
            duration === undefined
                ? undefined
                : Math.max(0, Number(duration) || 0),
        code: cleanText(code || error?.code),
        timestamp,
        error
    });
}

function display(type, options = {}) {
    const notification = normalizeError({
        ...options,
        type
    });

    if (type === ERROR_TYPES.ERROR && options.log !== false) {
        logError(options.error || notification);
    }

    return createToast(notification);
}

export function showError(options = {}) {
    return display(ERROR_TYPES.ERROR, options);
}

export function showWarning(options = {}) {
    return display(ERROR_TYPES.WARNING, options);
}

export function showSuccess(options = {}) {
    return display(ERROR_TYPES.SUCCESS, options);
}

export function showInfo(options = {}) {
    return display(ERROR_TYPES.INFO, options);
}

export function logError(error, context = "") {
    const prefix = cleanText(context);
    const stack = error?.stack || error;

    if (DEBUG.ENABLED) {
        writeErrorLog("APP", ...(prefix ? [prefix] : []), stack);
    }

    return error;
}

export function handleError(error, options = {}) {
    const normalizedOptions =
        typeof options === "string" ? { message: options } : options;
    const appError =
        error instanceof AppError
            ? error
            : new AppError({
                  title:
                      normalizedOptions.title ||
                      DEFAULT_TITLES[ERROR_TYPES.ERROR],
                  message: getUserFriendlyErrorMessage(
                      error,
                      normalizedOptions.message
                  ),
                  type: ERROR_TYPES.ERROR,
                  code:
                      normalizedOptions.code ||
                      error?.code ||
                      "UNEXPECTED_ERROR",
                  cause: error
              });

    logError(error, appError.code);

    if (normalizedOptions.rethrow === true) {
        throw appError;
    }

    return showError({
        title: appError.title,
        message: appError.message,
        code: appError.code,
        timestamp: appError.timestamp,
        log: false
    });
}
