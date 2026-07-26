import { describe, expect, it } from "vitest";

import { mapAuthError } from "./auth-error-mapper.js";

describe("mapAuthError", () => {
    it.each([
        [
            "auth/user-not-found",
            "No account was found with that email address."
        ],
        ["auth/wrong-password", "Incorrect password."],
        [
            "auth/email-already-in-use",
            "An account with this email address already exists."
        ],
        [
            "auth/invalid-credential",
            "The email address or password you entered is incorrect."
        ],
        [
            "auth/too-many-requests",
            "Too many attempts were made. Wait a moment and try again."
        ],
        [
            "auth/network-request-failed",
            "We could not connect. Check your internet connection and try again."
        ]
    ])("maps %s to a friendly message", (code, expectedMessage) => {
        expect(mapAuthError({ code })).toBe(expectedMessage);
    });

    it.each([undefined, null, {}, { code: "auth/unknown" }])(
        "returns a safe fallback for an unsupported error",
        (error) => {
            expect(mapAuthError(error)).toBe(
                "Something went wrong. Please try again."
            );
        }
    );
});
