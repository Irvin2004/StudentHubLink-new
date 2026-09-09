import { describe, expect, test } from "vitest";

import {
    filterAndSortResources,
    formatResourceLastOpened,
    getResourceDashboardData,
    getResourceType,
    selectFavoriteResources,
    selectRecentResources
} from "./resource-library.js";

const resources = [
    {
        communityId: "science",
        extension: "PDF",
        originalName: "Zoology notes.pdf",
        title: "Zoology notes",
        uploadedAt: new Date("2026-01-01")
    },
    {
        communityId: "maths",
        extension: "xlsx",
        originalName: "Algebra workbook.xlsx",
        title: "Algebra workbook",
        uploadedAt: new Date("2026-02-01")
    }
];

describe("resource library selectors", () => {
    test("recognises the supported resource types", () => {
        expect(getResourceType({ extension: "pdf" })).toBe("pdf");
        expect(getResourceType({ extension: "jpg" })).toBe("image");
        expect(getResourceType({ extension: "docx" })).toBe("document");
        expect(getResourceType({ extension: "csv" })).toBe("spreadsheet");
        expect(getResourceType({ extension: "pptx" })).toBe("presentation");
    });

    test("searches and filters without mutating the source list", () => {
        expect(
            filterAndSortResources(resources, {
                community: "maths",
                query: "workbook",
                type: "spreadsheet"
            })
        ).toEqual([resources[1]]);
        expect(resources[0].title).toBe("Zoology notes");
    });

    test("sorts by newest, oldest, and name", () => {
        expect(
            filterAndSortResources(resources).map((item) => item.title)
        ).toEqual(["Algebra workbook", "Zoology notes"]);
        expect(
            filterAndSortResources(resources, { sort: "oldest" }).map(
                (item) => item.title
            )
        ).toEqual(["Zoology notes", "Algebra workbook"]);
        expect(
            filterAndSortResources(resources, { sort: "name" }).map(
                (item) => item.title
            )
        ).toEqual(["Algebra workbook", "Zoology notes"]);
    });

    test("shares recent and favourite ordering with the dashboard", () => {
        const enriched = [
            {
                ...resources[0],
                favoriteAt: new Date("2026-03-01"),
                lastOpened: new Date("2026-04-01"),
                resourceKey: "science:general:zoology"
            },
            {
                ...resources[1],
                favoriteAt: new Date("2026-02-01"),
                lastOpened: new Date("2026-05-01"),
                resourceKey: "maths:general:algebra"
            }
        ];
        const favorites = {
            "maths:general:algebra": "favorite-2",
            "science:general:zoology": "favorite-1"
        };

        expect(selectRecentResources(enriched)[0].title).toBe(
            "Algebra workbook"
        );
        expect(selectFavoriteResources(enriched, favorites)[0].title).toBe(
            "Zoology notes"
        );
        expect(getResourceDashboardData(enriched, favorites)).toMatchObject({
            resourceCount: 2
        });
    });

    test("formats persisted open times for dashboard display", () => {
        const now = new Date("2026-08-10T12:00:00Z");

        expect(formatResourceLastOpened("2026-08-10T10:00:00Z", now)).toBe(
            "2h ago"
        );
        expect(formatResourceLastOpened("2026-08-09T10:00:00Z", now)).toBe(
            "Yesterday"
        );
    });

    test("caps the shared recent list at the latest ten resources", () => {
        const recent = Array.from({ length: 12 }, (_, index) => ({
            lastOpened: new Date(2026, 0, index + 1),
            resourceKey: `resource-${index}`,
            title: `Resource ${index}`
        }));
        const selected = selectRecentResources(recent);

        expect(selected).toHaveLength(10);
        expect(selected[0].resourceKey).toBe("resource-11");
        expect(selected.at(-1).resourceKey).toBe("resource-2");
    });
});
