import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ERROR_TYPES } from "../js/config/error-types.js";
import { AppError } from "../js/models/app-error.js";
import {
    getUserFriendlyErrorMessage,
    normalizeError
} from "../js/services/error-service.js";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("error types are centralized, unique, and immutable", () => {
    const values = Object.values(ERROR_TYPES);

    assert.deepEqual(values, ["info", "success", "warning", "error"]);
    assert.equal(new Set(values).size, values.length);
    assert.ok(Object.isFrozen(ERROR_TYPES));
});

test("AppError preserves structured user-safe metadata", () => {
    const timestamp = Date.now();
    const error = new AppError({
        title: "Upload Failed",
        message: "Unable to upload file.",
        code: "UPLOAD_ERROR",
        timestamp
    });

    assert.equal(error.name, "AppError");
    assert.deepEqual(error.toJSON(), {
        title: "Upload Failed",
        message: "Unable to upload file.",
        type: ERROR_TYPES.ERROR,
        code: "UPLOAD_ERROR",
        timestamp
    });
});

test("error service normalizes supported notification types", () => {
    Object.values(ERROR_TYPES).forEach((type) => {
        const notification = normalizeError({
            type,
            message: "Saved."
        });

        assert.equal(notification.type, type);
        assert.ok(notification.title);
        assert.ok(Object.isFrozen(notification));
    });

    assert.equal(
        getUserFriendlyErrorMessage({ code: "permission-denied" }),
        "You don't have permission to perform this action."
    );
});

test("error service owns reporting while toast owns DOM rendering", () => {
    const service = read("js/services/error-service.js");
    const component = read("js/components/toast.js");
    const styles = read("css/components/toast.css");

    assert.doesNotMatch(
        service,
        /globalThis\.document|window\.|innerHTML|createElement|firebasejs/i
    );
    assert.match(component, /export function createToast/);
    assert.match(component, /aria-live/);
    assert.match(component, /\[ERROR_TYPES\.SUCCESS\]: 3000/);
    assert.match(component, /\[ERROR_TYPES\.INFO\]: 4000/);
    assert.match(component, /\[ERROR_TYPES\.WARNING\]: 5000/);
    assert.match(component, /\[ERROR_TYPES\.ERROR\]: 6000/);
    assert.match(styles, /\.toast--success/);
    assert.match(styles, /\.toast--warning/);
    assert.match(styles, /\.toast--info/);
    assert.match(styles, /\.toast--error/);

    [
        "showError",
        "showWarning",
        "showSuccess",
        "showInfo",
        "logError",
        "handleError"
    ].forEach((apiName) => {
        assert.match(service, new RegExp(`export function ${apiName}\\(`));
    });
});

test("controllers and services avoid direct console error handling", () => {
    [
        "js/controllers/chat-controller.js",
        "js/controllers/reaction-controller.js",
        "js/controllers/reply-navigation-controller.js",
        "js/services/download-service.js",
        "js/services/message-service.js",
        "js/services/storage-service.js",
        "src/services/theme-service.js"
    ].forEach((path) => {
        assert.doesNotMatch(read(path), /console\.(?:error|warn)\(/);
    });
});
