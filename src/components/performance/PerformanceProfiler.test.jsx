import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PerformanceProfiler from "./PerformanceProfiler";

const observability = vi.hoisted(() => ({
    recordRender: vi.fn()
}));

vi.mock("../../hooks/useObservability.js", () => ({
    useObservability: () => observability
}));

describe("PerformanceProfiler", () => {
    it("records React render measurements in development", () => {
        render(
            <PerformanceProfiler id="TestSurface">
                <p>Profiled content</p>
            </PerformanceProfiler>
        );

        expect(screen.getByText("Profiled content")).toBeInTheDocument();
        expect(observability.recordRender).toHaveBeenCalledWith(
            "TestSurface",
            "mount",
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number)
        );
    });
});
