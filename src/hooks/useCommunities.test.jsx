import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AuthContext } from "../context/auth-context.js";

const mocks = vi.hoisted(() => ({
    createCommunity: vi.fn(),
    getCommunitiesPage: vi.fn(),
    getCommunityMembershipIds: vi.fn(),
    joinCommunity: vi.fn(),
    leaveCommunity: vi.fn()
}));

vi.mock("../services/community-service.js", () => ({
    createCommunity: mocks.createCommunity,
    getCommunitiesPage: mocks.getCommunitiesPage,
    getCommunityMembershipIds: mocks.getCommunityMembershipIds,
    joinCommunity: mocks.joinCommunity,
    leaveCommunity: mocks.leaveCommunity
}));

import { useCommunities } from "./useCommunities.js";

function wrapper({ children }) {
    return (
        <AuthContext.Provider value={{ user: { uid: "user-1" } }}>
            {children}
        </AuthContext.Provider>
    );
}

describe("useCommunities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getCommunitiesPage.mockResolvedValue({
            communities: [],
            cursor: null,
            hasMore: false
        });
        mocks.getCommunityMembershipIds.mockResolvedValue([]);
    });

    test("loads communities and exposes authenticated mutations", async () => {
        const created = {
            id: "community-1",
            name: "Robotics Club"
        };

        mocks.createCommunity.mockResolvedValue(created);
        mocks.joinCommunity.mockResolvedValue({
            communityId: "community-1",
            userId: "user-1"
        });
        mocks.leaveCommunity.mockResolvedValue();

        const { result } = renderHook(() => useCommunities(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.createCommunity({
                name: "Robotics Club"
            });
        });

        expect(mocks.createCommunity).toHaveBeenCalledWith(
            { name: "Robotics Club" },
            "user-1"
        );
        expect(result.current.communities).toEqual([created]);

        await act(async () => {
            await result.current.joinCommunity("community-1");
            await result.current.leaveCommunity("community-1");
        });

        expect(mocks.joinCommunity).toHaveBeenCalledWith(
            "community-1",
            "user-1",
            null
        );
        expect(mocks.leaveCommunity).toHaveBeenCalledWith(
            "community-1",
            "user-1"
        );
        expect(mocks.getCommunitiesPage).toHaveBeenCalledOnce();
        expect(mocks.getCommunityMembershipIds).toHaveBeenCalledOnce();
    });

    test("surfaces loading failures without mutating the list", async () => {
        const failure = new Error("Network unavailable");

        mocks.getCommunitiesPage.mockRejectedValue(failure);

        const { result } = renderHook(() => useCommunities(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe(failure);
        expect(result.current.communities).toEqual([]);
    });

    test("optimistically updates member counts and rolls back failures", async () => {
        const community = {
            id: "community-1",
            name: "Robotics Club",
            memberCount: 4
        };
        let rejectJoin;
        const pendingJoin = new Promise((_, reject) => {
            rejectJoin = reject;
        });

        mocks.getCommunitiesPage.mockResolvedValue({
            communities: [community],
            cursor: { id: community.id },
            hasMore: false
        });
        mocks.joinCommunity.mockReturnValue(pendingJoin);

        const { result } = renderHook(() => useCommunities(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        let joinResult;
        act(() => {
            joinResult = result.current.joinCommunity("community-1");
        });

        expect(result.current.communities[0].memberCount).toBe(5);

        const failure = new Error("Join failed");
        await act(async () => {
            rejectJoin(failure);
            await expect(joinResult).rejects.toBe(failure);
        });

        expect(result.current.communities[0].memberCount).toBe(4);
        expect(result.current.joinedCommunityIds.has("community-1")).toBe(
            false
        );
        expect(mocks.getCommunitiesPage).toHaveBeenCalledOnce();
    });

    test("loads another page once when requests overlap", async () => {
        mocks.getCommunitiesPage.mockResolvedValueOnce({
            communities: [{ id: "community-1", memberCount: 1 }],
            cursor: { id: "community-1" },
            hasMore: true
        });
        let resolveNextPage;
        mocks.getCommunitiesPage.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveNextPage = resolve;
            })
        );
        const { result } = renderHook(() => useCommunities(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        let firstRequest;
        let duplicateRequest;
        act(() => {
            firstRequest = result.current.loadMore();
            duplicateRequest = result.current.loadMore();
        });
        expect(mocks.getCommunitiesPage).toHaveBeenCalledTimes(2);

        await act(async () => {
            resolveNextPage({
                communities: [{ id: "community-2", memberCount: 1 }],
                cursor: { id: "community-2" },
                hasMore: false
            });
            await firstRequest;
            await duplicateRequest;
        });
        expect(result.current.communities).toHaveLength(2);
    });
});
