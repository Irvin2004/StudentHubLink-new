"use strict";

export const ERROR_TYPES = Object.freeze({
    INFO: "info",
    SUCCESS: "success",
    WARNING: "warning",
    ERROR: "error"
});

export const ALLOWED_ERROR_TYPES = Object.freeze(Object.values(ERROR_TYPES));
