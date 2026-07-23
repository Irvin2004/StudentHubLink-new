"use strict";

const frameQueue = new Map();

let frameId = null;
let taskId = 0;

function reducedMotionEnabled() {
    const rootSetting =
        globalThis.document?.documentElement?.dataset?.reducedMotion;

    if (rootSetting === "true") {
        return true;
    }

    return (
        globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ===
        true
    );
}

function requestFrame(callback) {
    if (typeof globalThis.requestAnimationFrame === "function") {
        return globalThis.requestAnimationFrame(callback);
    }

    return globalThis.setTimeout(() => callback(Date.now()), 16);
}

function cancelFrameRequest(identifier) {
    if (typeof globalThis.cancelAnimationFrame === "function") {
        globalThis.cancelAnimationFrame(identifier);
        return;
    }

    globalThis.clearTimeout(identifier);
}

function flushFrame(timestamp) {
    const tasks = [...frameQueue.values()];

    frameQueue.clear();
    frameId = null;
    tasks.forEach((callback) => callback(timestamp));
}

/**
 * Schedules a visual update in the shared animation-frame queue.
 *
 * @param {FrameRequestCallback} callback
 * @returns {Function} Cancels the queued callback.
 */
export function scheduleFrame(callback) {
    if (typeof callback !== "function") {
        throw new TypeError("Frame callback must be a function.");
    }

    if (reducedMotionEnabled()) {
        callback(Date.now());
        return () => {};
    }

    const identifier = ++taskId;

    frameQueue.set(identifier, callback);

    if (frameId === null) {
        frameId = requestFrame(flushFrame);
    }

    return () => {
        frameQueue.delete(identifier);

        if (frameQueue.size === 0 && frameId !== null) {
            cancelFrameRequest(frameId);
            frameId = null;
        }
    };
}

/**
 * Cancels every callback waiting in the shared frame queue.
 *
 * @returns {void}
 */
export function cancelScheduledFrames() {
    frameQueue.clear();

    if (frameId !== null) {
        cancelFrameRequest(frameId);
        frameId = null;
    }
}
