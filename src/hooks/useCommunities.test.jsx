import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AuthContext } from "../context/auth-context.js";

const mocks = vi.hoisted(() => ({
    createCommunity: vi.fn(),
    getCommunities: vi.fn(),
    joinCommunity: vi.fn(),
    leaveCommunity: vi.fn()
}));

vi.mock("../services/community-service.js", () => ({
    createCommunity: mocks.createCommunity,
    getCommunities: mocks.getCommunities,
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
        mocks.getCommunities.mockResolvedValue([]);
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
        expect(mocks.getCommunities).toHaveBeenCalledTimes(3);
    });

    test("surfaces loading failures without mutating the list", async () => {
        const failure = new Error("Network unavailable");

        mocks.getCommunities.mockRejectedValue(failure);

        const { result } = renderHook(() => useCommunities(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe(failure);
        expect(result.current.communities).toEqual([]);
    });
});
