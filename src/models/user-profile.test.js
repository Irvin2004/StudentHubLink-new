import { describe, expect, it } from "vitest";

import { createUserProfile } from "./user-profile.js";

describe("createUserProfile", () => {
    it("normalizes a Firebase user into the StudentHub profile model", () => {
        const profile = createUserProfile(
            {
                uid: "user-123",
                email: "  ALICE@example.com ",
                displayName: null,
                photoURL: "https://example.com/alice.jpg"
            },
            { fullName: "  Alice Student  " }
        );

        expect(profile).toEqual({
            uid: "user-123",
            email: "alice@example.com",
            displayName: "Alice Student",
            photoURL: "https://example.com/alice.jpg",
            profileVisibility: "public",
            role: "student",
            settings: {
                theme: "system"
            }
        });
        expect(Object.isFrozen(profile)).toBe(true);
        expect(Object.isFrozen(profile.settings)).toBe(true);
    });

    it("rejects incomplete profile data", () => {
        expect(() => createUserProfile(null)).toThrow(/Firebase user/);
        expect(() =>
            createUserProfile({ uid: "user-123", email: "a@example.com" })
        ).toThrow(/display name/);
    });
});
