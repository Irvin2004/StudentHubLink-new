import { DEBUG } from "../config/debug.js";

export function log(type, ...args) {
    if (!DEBUG.ENABLED) return;

    console.log(`[StudentHub:${type}]`, ...args);
}

export function warn(type, ...args) {
    if (!DEBUG.ENABLED) return;

    console.warn(`[StudentHub:${type}]`, ...args);
}

export function error(type, ...args) {
    console.error(`[StudentHub:${type}]`, ...args);
}
