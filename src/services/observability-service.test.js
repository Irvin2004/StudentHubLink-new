import { afterEach, describe, expect, test, vi } from "vitest";

import {
    captureError,
    configureObservability,
    getRecentTelemetry,
    recordMetric,
    trackEvent
} from "./observability-service.js";

describe("observability service", () => {
    afterEach(() => configureObservability(null));

    test("records metrics, events, and sanitized errors", () => {
        const adapter = vi.fn();
        configureObservability(adapter);

        trackEvent("community_opened", {
            communityId: "community-1",
            email: "private@example.com"
        });
        recordMetric("render_time", 12.4, { route: "community" });
        captureError(
            { code: "unavailable", message: "private backend detail" },
            { feature: "messages" }
        );

        expect(adapter).toHaveBeenCalledTimes(3);
        expect(adapter.mock.calls[0][0].details).toEqual({
            communityId: "community-1"
        });
        expect(getRecentTelemetry().at(-1)).toMatchObject({
            type: "error",
            name: "unavailable"
        });
    });

    test("ignores invalid metric values", () => {
        expect(recordMetric("invalid", Number.NaN)).toBeNull();
    });
});
