const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const SENSITIVE_PROPERTY_PATTERN =
    /email|filename|message|name|password|query|secret|text|token|url/i;
const MAX_PROPERTIES = 20;
const MAX_STRING_LENGTH = 120;
const MAX_BUFFER_SIZE = 100;

let analyticsAdapter = null;
let eventSequence = 0;
const eventBuffer = [];

function sanitizeProperties(properties) {
    if (!properties || typeof properties !== "object") return {};

    return Object.fromEntries(
        Object.entries(properties)
            .filter(([key]) => !SENSITIVE_PROPERTY_PATTERN.test(key))
            .flatMap(([key, value]) => {
                if (value === null || typeof value === "boolean") {
                    return [[key, value]];
                }

                if (typeof value === "number" && Number.isFinite(value)) {
                    return [[key, value]];
                }

                if (typeof value === "string") {
                    return [[key, value.slice(0, MAX_STRING_LENGTH)]];
                }

                return [];
            })
            .slice(0, MAX_PROPERTIES)
    );
}

function deliver(event) {
    if (!analyticsAdapter) return;

    try {
        const delivery = analyticsAdapter(event);
        if (delivery && typeof delivery.catch === "function") {
            delivery.catch(() => {});
        }
    } catch {
        // Analytics must never interrupt the user's workflow.
    }
}

export function track(name, properties = {}) {
    if (typeof name !== "string" || !EVENT_NAME_PATTERN.test(name)) {
        return null;
    }

    const event = Object.freeze({
        id: `analytics-${Date.now()}-${++eventSequence}`,
        name,
        occurredAt: new Date().toISOString(),
        properties: Object.freeze(sanitizeProperties(properties))
    });

    eventBuffer.push(event);
    if (eventBuffer.length > MAX_BUFFER_SIZE) eventBuffer.shift();
    deliver(event);

    return event;
}

export function configureAnalytics(adapter) {
    analyticsAdapter = typeof adapter === "function" ? adapter : null;
}

export function getRecentAnalytics() {
    return [...eventBuffer];
}

export function clearAnalytics() {
    eventBuffer.length = 0;
}
