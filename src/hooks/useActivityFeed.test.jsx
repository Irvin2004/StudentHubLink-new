import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listenToActivity: vi.fn(),
    unsubscribe: vi.fn()
}));

vi.mock("../services/activity-service.js", () => ({
    listenToActivity: mocks.listenToActivity
}));

import { useActivityFeed } from "./useActivityFeed.js";

describe("useActivityFeed", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.listenToActivity.mockReturnValue(mocks.unsubscribe);
    });

    test("defers its listener until the activity view is enabled", () => {
        const { rerender, result, unmount } = renderHook(
            ({ enabled }) => useActivityFeed("community-1", { enabled }),
            { initialProps: { enabled: false } }
        );

        expect(result.current.loading).toBe(false);
        expect(mocks.listenToActivity).not.toHaveBeenCalled();

        rerender({ enabled: true });
        expect(result.current.loading).toBe(true);
        expect(mocks.listenToActivity).toHaveBeenCalledOnce();

        const onData = mocks.listenToActivity.mock.calls[0][1];
        act(() => onData([{ id: "activity-1" }]));
        expect(result.current.activities).toEqual([{ id: "activity-1" }]);
        expect(result.current.loading).toBe(false);

        unmount();
        expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    });
});
