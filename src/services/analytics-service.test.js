import { afterEach, describe, expect, test, vi } from "vitest";

import {
    clearAnalytics,
    configureAnalytics,
    getRecentAnalytics,
    track
} from "./analytics-service.js";

describe("analytics service", () => {
    afterEach(() => {
        clearAnalytics();
        configureAnalytics(null);
    });

    test("records a normalized application event", () => {
        const event = track("community_joined", {
            communityId: "community-1",
            role: "member"
        });

        expect(event).toMatchObject({
            name: "community_joined",
            properties: {
                communityId: "community-1",
                role: "member"
            }
        });
        expect(getRecentAnalytics()).toEqual([event]);
    });

    test("removes user content and unsupported property values", () => {
        const event = track("search_performed", {
            query: "private search",
            resultCount: 4,
            metadata: { source: "search" }
        });

        expect(event.properties).toEqual({ resultCount: 4 });
    });

    test("delivers events through a replaceable adapter", () => {
        const adapter = vi.fn();
        configureAnalytics(adapter);

        const event = track("message_sent", { channelId: "channel-1" });

        expect(adapter).toHaveBeenCalledWith(event);
    });

    test("never interrupts a workflow when delivery fails", () => {
        configureAnalytics(() => {
            throw new Error("adapter unavailable");
        });

        expect(() => track("file_uploaded", { count: 1 })).not.toThrow();
        expect(getRecentAnalytics()).toHaveLength(1);
    });

    test("ignores invalid event names", () => {
        expect(track("Community Joined")).toBeNull();
        expect(getRecentAnalytics()).toEqual([]);
    });
});
