import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (query) => ({
            addEventListener: () => {},
            matches: false,
            media: query,
            removeEventListener: () => {}
        })
    });
}

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
    window.cancelAnimationFrame = (frame) => window.clearTimeout(frame);
}
