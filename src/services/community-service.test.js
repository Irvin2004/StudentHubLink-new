import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const timestamp = { _methodName: "serverTimestamp" };

    return {
        auth: { currentUser: { uid: "owner-1" } },
        batch: {
            commit: vi.fn(),
            delete: vi.fn(),
            set: vi.fn()
        },
        deleteDoc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        runTransaction: vi.fn(),
        setDoc: vi.fn(),
        timestamp,
        transaction: {
            delete: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            update: vi.fn()
        },
        updateDoc: vi.fn()
    };
});

vi.mock("firebase/firestore", () => ({
    collection: (...segments) => ({
        kind: "collection",
        path: segments.map((segment) => segment.path || segment).join("/")
    }),
    deleteDoc: mocks.deleteDoc,
    doc: (...segments) => {
        if (segments.length === 1) {
            return {
                id: "community-1",
                kind: "community",
                path: "communities/community-1"
            };
        }

        const path = segments
            .slice(1)
            .map((segment) => segment.path || segment)
            .join("/");

        return {
            id: segments.at(-1),
            kind: path.includes("/members/")
                ? "member"
                : path.includes("/channels/")
                  ? "channel"
                  : "community",
            path
        };
    },
    endAt: (value) => ({ type: "endAt", value }),
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    limit: (value) => ({ type: "limit", value }),
    orderBy: (field, direction) => ({ type: "orderBy", field, direction }),
    query: (reference, ...constraints) => ({ reference, constraints }),
    runTransaction: mocks.runTransaction,
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc,
    startAt: (value) => ({ type: "startAt", value }),
    updateDoc: mocks.updateDoc,
    where: (field, operator, value) => ({
        type: "where",
        field,
        operator,
        value
    }),
    writeBatch: () => mocks.batch
}));

vi.mock("../firebase/index.js", () => ({
    auth: mocks.auth,
    db: { name: "test-db" }
}));

import { COMMUNITY_ROLES } from "../config/community-roles.js";
import {
    createCommunity,
    joinCommunity,
    leaveCommunity,
    searchCommunities,
    updateMemberRole
} from "./community-service.js";

function communitySnapshot(data = {}) {
    return {
        id: "community-1",
        exists: () => true,
        data: () => ({
            name: "Robotics Club",
            normalizedName: "robotics club",
            description: "",
            avatar: null,
            banner: null,
            ownerId: "owner-1",
            visibility: "public",
            category: "technology",
            memberCount: 1,
            createdAt: 1,
            updatedAt: 1,
            ...data
        })
    };
}

function memberSnapshot(data = {}) {
    return {
        id: data.userId || "user-2",
        exists: () => true,
        data: () => ({
            userId: "user-2",
            communityId: "community-1",
            role: COMMUNITY_ROLES.MEMBER,
            joinedAt: 1,
            nickname: null,
            ...data
        })
    };
}

describe("community service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.currentUser = { uid: "owner-1" };
        mocks.batch.commit.mockResolvedValue();
        mocks.getDocs.mockResolvedValue({
            docs: [],
            empty: true,
            size: 0
        });
        mocks.runTransaction.mockImplementation(async (_db, operation) =>
            operation(mocks.transaction)
        );
    });

    test("creates a normalized community and owner membership in one batch", async () => {
        const community = await createCommunity({
            name: "  Robotics   Club ",
            category: "technology",
            visibility: "private"
        });

        expect(community).toMatchObject({
            id: "community-1",
            name: "Robotics Club",
            normalizedName: "robotics club",
            ownerId: "owner-1",
            visibility: "private",
            memberCount: 1
        });
        expect(mocks.batch.set).toHaveBeenCalledTimes(3);
        expect(mocks.batch.set).toHaveBeenCalledWith(
            expect.objectContaining({ kind: "member" }),
            expect.objectContaining({
                role: COMMUNITY_ROLES.OWNER,
                userId: "owner-1"
            })
        );
        expect(mocks.batch.set).toHaveBeenCalledWith(
            expect.objectContaining({ id: "general", kind: "channel" }),
            expect.objectContaining({
                communityId: "community-1",
                name: "general",
                position: 0,
                type: "TEXT"
            })
        );
        expect(mocks.batch.commit).toHaveBeenCalledOnce();
    });

    test("rejects duplicate normalized names before writing", async () => {
        mocks.getDocs.mockResolvedValue({
            docs: [{ id: "existing-community" }],
            empty: false,
            size: 1
        });

        await expect(
            createCommunity({
                name: "Robotics Club",
                category: "technology"
            })
        ).rejects.toThrow(/already exists/);
        expect(mocks.batch.commit).not.toHaveBeenCalled();
    });

    test("joins once and increments the community member count", async () => {
        mocks.transaction.get
            .mockResolvedValueOnce(communitySnapshot({ memberCount: 4 }))
            .mockResolvedValueOnce({
                exists: () => false
            });

        const member = await joinCommunity("community-1", "user-2", "Builder");

        expect(member).toMatchObject({
            userId: "user-2",
            role: COMMUNITY_ROLES.MEMBER,
            nickname: "Builder"
        });
        expect(mocks.transaction.set).toHaveBeenCalledOnce();
        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.objectContaining({ kind: "community" }),
            expect.objectContaining({ memberCount: 5 })
        );
    });

    test("leaves transactionally without allowing the owner to leave", async () => {
        mocks.transaction.get
            .mockResolvedValueOnce(communitySnapshot({ memberCount: 2 }))
            .mockResolvedValueOnce(memberSnapshot());

        await leaveCommunity("community-1", "user-2");

        expect(mocks.transaction.delete).toHaveBeenCalledOnce();
        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ memberCount: 1 })
        );

        mocks.transaction.get
            .mockResolvedValueOnce(communitySnapshot())
            .mockResolvedValueOnce(
                memberSnapshot({
                    userId: "owner-1",
                    role: COMMUNITY_ROLES.OWNER
                })
            );

        await expect(leaveCommunity("community-1", "owner-1")).rejects.toThrow(
            /owner cannot leave/
        );
    });

    test("validates role changes and stores supported roles", async () => {
        mocks.getDoc.mockResolvedValue(memberSnapshot());

        await expect(
            updateMemberRole("community-1", "user-2", COMMUNITY_ROLES.MODERATOR)
        ).resolves.toMatchObject({ role: COMMUNITY_ROLES.MODERATOR });
        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.anything(),
            { role: COMMUNITY_ROLES.MODERATOR },
            { merge: true }
        );

        await expect(
            updateMemberRole("community-1", "user-2", COMMUNITY_ROLES.OWNER)
        ).rejects.toThrow(/ownership transfers/i);
    });

    test("normalizes prefix searches before building the Firestore query", async () => {
        await expect(searchCommunities("  ROBOTICS   Club ")).resolves.toEqual(
            []
        );

        const searchQuery = mocks.getDocs.mock.calls[0][0];

        expect(searchQuery.constraints).toContainEqual({
            type: "startAt",
            value: "robotics club"
        });
        expect(searchQuery.constraints).toContainEqual({
            type: "endAt",
            value: "robotics club\uf8ff"
        });
    });
});
