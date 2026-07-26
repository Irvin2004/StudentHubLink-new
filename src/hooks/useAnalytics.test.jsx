import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useAnalytics } from "./useAnalytics.js";

describe("useAnalytics", () => {
    test("exposes a stable tracking API", () => {
        const { result, rerender } = renderHook(() => useAnalytics());
        const initialValue = result.current;

        rerender();

        expect(result.current).toBe(initialValue);
        expect(result.current.track).toEqual(expect.any(Function));
    });
});
