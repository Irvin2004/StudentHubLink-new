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
    startAt: (value) => ({ kind: "startAt", value })
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

describe("search service", () => {
    beforeEach(() => {
        firebase.getDocs.mockReset();
    });

    it("searches communities by normalized name prefix", async () => {
        firebase.getDocs.mockResolvedValue({
            docs: [
                snapshot("robotics", {
                    category: "Engineering",
                    name: "Robotics Club"
                })
            ]
        });

        await expect(searchCommunities(" RoB ")).resolves.toEqual([
            expect.objectContaining({
                title: "Robotics Club",
                type: "community",
                url: "/community/robotics"
            })
        ]);
        expect(firebase.query).toHaveBeenCalledWith(
            { kind: "collection", name: "communities" },
            expect.objectContaining({
                field: "normalizedName",
                kind: "orderBy"
            }),
            { kind: "startAt", value: "rob" },
            { kind: "endAt", value: "rob\uf8ff" },
            { kind: "limit", value: 6 }
        );
    });

    it("searches channels and maps their community route", async () => {
        firebase.getDocs.mockResolvedValue({
            docs: [
                snapshot(
                    "python-help",
                    { description: "Get unstuck", name: "python-help" },
                    { parent: { parent: { id: "programming" } } }
                )
            ]
        });

        await expect(searchChannels("py")).resolves.toEqual([
            expect.objectContaining({
                title: "#python-help",
                type: "channel",
                url: "/community/programming/channel/python-help"
            })
        ]);
    });

    it("searches files and maps their channel route", async () => {
        firebase.getDocs.mockResolvedValue({
            docs: [
                snapshot(
                    "notes",
                    {
                        filename: "Python Notes.pdf",
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
                )
            ]
        });

        await expect(searchFiles("python")).resolves.toEqual([
            expect.objectContaining({
                title: "Python Notes.pdf",
                type: "file",
                url: "/community/programming/channel/general?view=files&file=notes"
            })
        ]);
    });

    it("does not read the database for short or empty queries", async () => {
        await expect(globalSearch("a")).resolves.toEqual({
            channels: [],
            communities: [],
            files: []
        });
        expect(firebase.getDocs).not.toHaveBeenCalled();
    });

    it("runs all searches in one parallel flow and propagates errors", async () => {
        firebase.getDocs
            .mockResolvedValueOnce({ docs: [] })
            .mockResolvedValueOnce({ docs: [] })
            .mockResolvedValueOnce({ docs: [] });

        await expect(globalSearch("robot")).resolves.toEqual({
            channels: [],
            communities: [],
            files: []
        });
        expect(firebase.getDocs).toHaveBeenCalledTimes(3);

        firebase.getDocs.mockRejectedValueOnce(
            Object.assign(new Error("Offline"), { code: "unavailable" })
        );
        await expect(globalSearch("notes")).rejects.toMatchObject({
            code: "unavailable"
        });
    });
});
