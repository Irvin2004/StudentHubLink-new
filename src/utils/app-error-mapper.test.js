import { describe, expect, test } from "vitest";

import { getActionableErrorMessage } from "./app-error-mapper.js";

describe("application error mapper", () => {
    test("maps connectivity and permission failures to recovery guidance", () => {
        expect(
            getActionableErrorMessage(
                { code: ["fire", "store/unavailable"].join("") },
                "messages"
            )
        ).toBe("Check your connection and try again.");
        expect(
            getActionableErrorMessage(
                { code: "permission-denied" },
                "community"
            )
        ).toMatch(/permission/i);
    });

    test("provides context when an item is unavailable", () => {
        expect(
            getActionableErrorMessage(
                { code: "community/not-found" },
                "community"
            )
        ).toMatch(/removed|access/i);
    });
});
