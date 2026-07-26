import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listenToFiles: vi.fn(),
    unsubscribe: vi.fn()
}));

vi.mock("./useAuth.js", () => ({
    useAuth: () => ({
        profile: { displayName: "Alex" },
        user: { uid: "user-1" }
    })
}));

vi.mock("../services/file-service.js", () => ({
    deleteFile: vi.fn(),
    downloadFile: vi.fn(),
    listenToFiles: mocks.listenToFiles,
    uploadFile: vi.fn()
}));

import { useFiles } from "./useFiles.js";

describe("useFiles", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.listenToFiles.mockReturnValue(mocks.unsubscribe);
    });

    test("subscribes only while the shared-files view is active", () => {
        const { rerender, result, unmount } = renderHook(
            ({ subscribe }) =>
                useFiles("general", {
                    communityId: "community-1",
                    subscribe
                }),
            { initialProps: { subscribe: false } }
        );

        expect(result.current.loading).toBe(false);
        expect(mocks.listenToFiles).not.toHaveBeenCalled();

        rerender({ subscribe: true });
        expect(result.current.loading).toBe(true);
        expect(mocks.listenToFiles).toHaveBeenCalledOnce();

        const onData = mocks.listenToFiles.mock.calls[0][2];
        act(() => onData([{ id: "file-1" }]));
        expect(result.current.files).toEqual([{ id: "file-1" }]);

        unmount();
        expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    });
});
