import { describe, expect, test } from "vitest";

import {
    normalizeCommunityText,
    validateCommunityInput,
    validateCommunityUpdates
} from "./community-validation.js";

describe("community validation", () => {
    test("normalizes names and search values consistently", () => {
        expect(normalizeCommunityText("  Róbótics   CLUB ")).toBe(
            "róbótics club"
        );

        expect(
            validateCommunityInput({
                name: "  Robotics   Club ",
                description: "  Build together.  ",
                visibility: "public",
                category: " Technology "
            })
        ).toEqual({
            name: "Robotics Club",
            normalizedName: "robotics club",
            description: "Build together.",
            avatar: null,
            banner: null,
            visibility: "public",
            category: "technology"
        });
    });

    test("rejects missing names, unknown categories, and invalid media URLs", () => {
        expect(() =>
            validateCommunityInput({
                name: "",
                visibility: "public",
                category: "technology"
            })
        ).toThrow(/name/);
        expect(() =>
            validateCommunityInput({
                name: "Robotics",
                visibility: "public",
                category: "unknown"
            })
        ).toThrow(/category/);
        expect(() =>
            validateCommunityInput({
                name: "Robotics",
                visibility: "secret",
                category: "technology"
            })
        ).toThrow(/visibility/);
        expect(() =>
            validateCommunityInput({
                name: "Robotics",
                visibility: "public",
                category: "technology",
                avatar: "ftp://example.com/avatar.png"
            })
        ).toThrow(/HTTP URL/);
    });

    test("returns only allowed mutable fields for updates", () => {
        const current = {
            name: "Robotics Club",
            description: "Build.",
            avatar: null,
            banner: null,
            visibility: "public",
            category: "technology"
        };

        expect(
            validateCommunityUpdates({ name: "  Robotics Society  " }, current)
        ).toEqual({
            name: "Robotics Society",
            normalizedName: "robotics society"
        });
        expect(() =>
            validateCommunityUpdates({ ownerId: "attacker" }, current)
        ).toThrow(/cannot be updated/);
    });
});
