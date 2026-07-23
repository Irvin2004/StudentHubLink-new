"use strict";

import {
    ALLOWED_ERROR_TYPES,
    ERROR_TYPES
} from "../config/error-types.js";

function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

export class AppError extends Error {
    constructor({
        title = "Something went wrong",
        message = "Please try again.",
        type = ERROR_TYPES.ERROR,
        code = "APP_ERROR",
        timestamp = Date.now(),
        cause
    } = {}) {
        const cleanMessage = cleanText(message);

        if (!cleanMessage) {
            throw new TypeError("App error message is required.");
        }

        if (!ALLOWED_ERROR_TYPES.includes(type)) {
            throw new TypeError(`Invalid app error type: ${type}`);
        }

        super(cleanMessage, cause === undefined ? undefined : { cause });

        this.name = "AppError";
        this.title = cleanText(title) || "Something went wrong";
        this.type = type;
        this.code = cleanText(code) || "APP_ERROR";
        this.timestamp = Number.isFinite(timestamp)
            ? timestamp
            : Date.now();

        if (cause !== undefined && this.cause === undefined) {
            this.cause = cause;
        }
    }

    toJSON() {
        return {
            title: this.title,
            message: this.message,
            type: this.type,
            code: this.code,
            timestamp: this.timestamp
        };
    }
}

export function createAppError(options) {
    return options instanceof AppError
        ? options
        : new AppError(options);
}
