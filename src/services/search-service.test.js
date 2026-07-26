import { beforeEach, describe, expect, it, vi } from "vitest";

const firebase = vi.hoisted(() => ({
    getDocs: vi.fn(),
    query: vi.fn((reference, ...constraints) => ({
        constraints,
        reference
    }))
}));

vi.mock("firebase/firestore", () => ({
    collection: (_database, name) => ({ kind: "collection", name }),
    collectionGroup: (_database, name) => ({
        kind: "collectionGroup",
        name
    }),
    endAt: (value) => ({ kind: "endAt", value }),
    getDocs: firebase.getDocs,
    limit: (value) => ({ kind: "limit", value }),
    orderBy: (field) => ({ field, kind: "orderBy" }),
    query: firebase.query,
    startAt: (value) => ({ kind: "startAt", value }),
    where: (field, operator, value) => ({
        field,
        kind: "where",
        operator,
        value
    })
}));

vi.mock("../firebase/firestore.js", () => ({ db: { id: "database" } }));

import {
    globalSearch,
    searchChannels,
    searchCommunities,
    searchFiles
} from "./search-service.js";

function snapshot(id, data, ref = {}) {
    return { data: () => data, id, ref };
}

function queryField(searchQuery) {
    return searchQuery.constraints.find(
        ({ kind }) => kind === "orderBy" || kind === "where"
    )?.field;
}

function mockDocumentsByField(documentsByField) {
    firebase.getDocs.mockImplementation((searchQuery) =>
        Promise.resolve({
            docs: documentsByField[queryField(searchQuery)] || []
        })
    );
}

describe("search service", () => {
    beforeEach(() => {
        firebase.getDocs.mockReset();
        firebase.query.mockClear();
    });

    it("searches community names and descriptions", async () => {
        mockDocumentsByField({
            normalizedDescription: [
                snapshot("robotics", {
                    category: "Engineering",
                    description: "Python-powered robots",
                    name: "Robotics Club",
                    normalizedDescription: "python-powered robots",
                    normalizedName: "robotics club"
                })
            ],
            normalizedName: []
        });

        await expect(searchCommunities(" Python ")).resolves.toEqual([
            {
                icon: "community",
                id: "robotics",
                subtitle: "Python-powered robots",
                title: "Robotics Club",
                type: "community",
                url: "/community/robotics"
            }
        ]);
        expect(firebase.query).toHaveBeenCalledWith(
            { kind: "collection", name: "communities" },
            expect.objectContaining({
                field: "normalizedDescription",
                kind: "orderBy"
            }),
            { kind: "startAt", value: "python" },
            { kind: "endAt", value: "python\uf8ff" },
            { kind: "limit", value: 5 }
        );
    });

    it("searches channels and maps their community route", async () => {
        mockDocumentsByField({
            name: [
                snapshot(
                    "python-help",
                    { description: "Get unstuck", name: "python-help" },
                    { parent: { parent: { id: "programming" } } }
                )
            ]
        });

        await expect(searchChannels("py")).resolves.toEqual([
            {
                icon: "channel",
                id: "python-help",
                subtitle: "Get unstuck",
                title: "#python-help",
                type: "channel",
                url: "/community/programming/channel/python-help"
            }
        ]);
    });

    it("searches filenames and tags without returning duplicates", async () => {
        const notes = snapshot(
            "notes",
            {
                filename: "Python Notes.pdf",
                normalizedFilename: "python notes.pdf",
                tags: ["python"],
                uploadedByName: "Alex"
            },
            {
                parent: {
                    parent: {
                        id: "general",
                        parent: { parent: { id: "programming" } }
                    }
                }
            }
        );
        mockDocumentsByField({
            normalizedFilename: [notes],
            tags: [notes]
        });

        await expect(searchFiles("python")).resolves.toEqual([
            {
                icon: "file",
                id: "notes",
                subtitle: "Alex",
                title: "Python Notes.pdf",
                type: "file",
                url: "/community/programming/channel/general?view=files&file=notes"
            }
        ]);
    });

    it("merges, ranks, filters, and limits global results", async () => {
        mockDocumentsByField({
            name: [
                snapshot(
                    "python",
                    { name: "python-help" },
                    {
                        parent: {
                            parent: { id: "programming" }
                        }
                    }
                )
            ],
            normalizedDescription: [],
            normalizedFilename: [
                snapshot("notes", {
                    channelId: "general",
                    communityId: "programming",
                    filename: "My Python Notes.pdf",
                    normalizedFilename: "my python notes.pdf"
                })
            ],
            normalizedName: [
                snapshot("python-club", {
                    description: "A friendly community",
                    name: "Python Club",
                    normalizedName: "python club"
                })
            ],
            tags: []
        });

        const results = await globalSearch("python");

        expect(results).toHaveLength(3);
        expect(results.at(-1)?.type).toBe("file");
        expect(
            results
                .slice(0, 2)
                .map(({ type }) => type)
                .sort()
        ).toEqual(["channel", "community"]);

        firebase.getDocs.mockClear();
        await expect(globalSearch("python", "file")).resolves.toEqual([
            expect.objectContaining({ id: "notes", type: "file" })
        ]);
        expect(firebase.getDocs).toHaveBeenCalledTimes(2);
    });

    it("does not read Firestore for short or empty queries", async () => {
        await expect(globalSearch("a")).resolves.toEqual([]);
        await expect(searchFiles(" ")).resolves.toEqual([]);
        expect(firebase.getDocs).not.toHaveBeenCalled();
    });

    it("maps Firestore failures to one safe public error", async () => {
        firebase.getDocs.mockRejectedValue(
            Object.assign(new Error("Offline"), { code: "unavailable" })
        );

        await expect(searchCommunities("robot")).rejects.toThrow(
            "Unable to search StudentHub."
        );
        await expect(globalSearch("notes")).rejects.toEqual(
            new Error("Unable to search StudentHub.")
        );
    });
});
