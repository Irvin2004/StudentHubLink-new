import { describe, expect, test, vi } from "vitest";

import {
    createStudyContext,
    loadResourceContext,
    MAX_STUDY_RESOURCES
} from "./resource-context.js";

const resource = {
    communityName: "Science Club",
    extension: "txt",
    originalName: "Motion notes.txt",
    resourceKey: "science:general:file-1",
    title: "Motion notes",
    url: "https://example.test/motion.txt"
};

describe("resource context", () => {
    test("uses inline resource content without fetching the file", async () => {
        const fetcher = vi.fn();
        const context = await loadResourceContext(
            {
                ...resource,
                content:
                    "Velocity describes how displacement changes over time."
            },
            fetcher
        );

        expect(fetcher).not.toHaveBeenCalled();
        expect(context).toMatchObject({
            contextKind: "content",
            id: "science:general:file-1",
            subject: "Motion notes",
            title: "Motion notes"
        });
        expect(context.content).toContain(
            "Velocity describes how displacement changes over time."
        );
    });

    test("loads browser-readable text resources", async () => {
        const fetcher = vi.fn().mockResolvedValue({
            ok: true,
            text: vi
                .fn()
                .mockResolvedValue(
                    "Acceleration is the rate of change of velocity."
                )
        });

        const context = await loadResourceContext(resource, fetcher);

        expect(fetcher).toHaveBeenCalledWith(resource.url);
        expect(context.contextKind).toBe("text-file");
        expect(context.content).toContain(
            "Acceleration is the rate of change of velocity."
        );
    });

    test("keeps resource metadata when file text is unavailable", async () => {
        const context = await loadResourceContext(
            { ...resource, extension: "pdf" },
            vi.fn()
        );

        expect(context.contextKind).toBe("metadata");
        expect(context.content).toContain("Resource title: Motion notes");
        expect(context.content).toContain("Community: Science Club");
    });

    test("combines multiple resources under a stable set identity", () => {
        const motion = {
            content: "Motion content",
            id: "science:motion",
            title: "Motion notes"
        };
        const algebra = {
            content: "Algebra content",
            id: "maths:algebra",
            title: "Algebra sheet"
        };

        const context = createStudyContext([motion, algebra]);
        const reordered = createStudyContext([algebra, motion]);

        expect(context.id).toBe(reordered.id);
        expect(context).toMatchObject({
            contextKind: "multi-resource",
            subject: "Motion notes + Algebra sheet",
            title: "2 study materials"
        });
        expect(context.content).toContain("Study material 1: Motion notes");
        expect(context.content).toContain("Motion content");
        expect(context.content).toContain("Algebra content");
        expect(context.content.length).toBeLessThanOrEqual(12_000);
        expect(context.resources).toEqual([motion, algebra]);
    });

    test("preserves single-resource IDs and enforces the selection cap", () => {
        const contexts = Array.from(
            { length: MAX_STUDY_RESOURCES + 1 },
            (_, index) => ({
                content: `Resource ${index} content`,
                id: `resource-${index}`,
                title: `Resource ${index}`
            })
        );

        expect(createStudyContext([contexts[0]])).toMatchObject({
            id: "resource-0",
            resources: [contexts[0]]
        });
        expect(() => createStudyContext(contexts)).toThrow(
            `Choose up to ${MAX_STUDY_RESOURCES} study materials`
        );
    });
});
