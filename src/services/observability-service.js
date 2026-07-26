const MAX_BUFFER_SIZE = 100;
const telemetryBuffer = [];
let telemetryAdapter = null;

function sanitizeDetails(details = {}) {
    return Object.fromEntries(
        Object.entries(details).filter(
            ([key, value]) =>
                !/email|password|token|text|message/i.test(key) &&
                ["string", "number", "boolean"].includes(typeof value)
        )
    );
}

function record(type, name, details = {}) {
    const event = Object.freeze({
        type,
        name: String(name || "unknown"),
        details: sanitizeDetails(details),
        timestamp: new Date().toISOString()
    });

    telemetryBuffer.push(event);
    if (telemetryBuffer.length > MAX_BUFFER_SIZE) telemetryBuffer.shift();

    try {
        telemetryAdapter?.(event);
    } catch {
        // Observability must never interrupt the user workflow.
    }

    return event;
}

export function configureObservability(adapter) {
    telemetryAdapter = typeof adapter === "function" ? adapter : null;
}

export function captureError(error, context = {}) {
    return record("error", error?.code || error?.name || "application_error", {
        ...context,
        recoverable: context.recoverable !== false
    });
}

export function trackEvent(name, details) {
    return record("event", name, details);
}

export function recordMetric(name, value, details = {}) {
    if (!Number.isFinite(value)) return null;
    return record("metric", name, { ...details, value });
}

export function recordRender(id, phase, actualDuration, baseDuration) {
    return recordMetric("react_render", actualDuration, {
        id,
        phase,
        baseDuration: Number(baseDuration.toFixed(2))
    });
}

export function getRecentTelemetry() {
    return [...telemetryBuffer];
}

export function initializePerformanceMonitoring() {
    if (
        typeof PerformanceObserver === "undefined" ||
        typeof window === "undefined"
    ) {
        return () => {};
    }

    const observers = [];
    const observe = (type, callback) => {
        try {
            const observer = new PerformanceObserver((list) =>
                list.getEntries().forEach(callback)
            );
            observer.observe({ type, buffered: true });
            observers.push(observer);
        } catch {
            // The browser does not support this performance entry type.
        }
    };

    observe("largest-contentful-paint", (entry) =>
        recordMetric("largest_contentful_paint", entry.startTime)
    );
    observe("layout-shift", (entry) => {
        if (!entry.hadRecentInput) {
            recordMetric("layout_shift", entry.value);
        }
    });
    observe("longtask", (entry) =>
        recordMetric("long_task", entry.duration, {
            startTime: Math.round(entry.startTime)
        })
    );

    return () => observers.forEach((observer) => observer.disconnect());
}
