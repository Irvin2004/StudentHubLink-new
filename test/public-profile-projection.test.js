import test from "node:test";
import assert from "node:assert/strict";

import { toPublicProfile } from "../src/utils/public-profile-projection.js";

test("replaces a legacy public profile with an allowlisted projection", () => {
    const updatedAt = { serverTimestamp: true };
    const clean = toPublicProfile(
        {
            displayName: "Private source name",
            fullName: "Ada Lovelace",
            institution: "University",
            course: "Computing",
            profileVisibility: "public",
            email: "private@example.test",
            role: "admin",
            totalEarnings: 900,
            lastLoginAt: "private"
        },
        {
            displayName: "Edited public name",
            bio: "Public biography",
            profileVisibility: "private",
            email: "leaked@example.test",
            role: "admin",
            totalUploads: 12,
            totalEarnings: 500
        },
        updatedAt
    );

    assert.deepEqual(clean, {
        displayName: "Edited public name",
        fullName: "Ada Lovelace",
        name: "Edited public name",
        photoURL: "",
        institution: "University",
        course: "Computing",
        yearOfStudy: "",
        bio: "Public biography",
        profileVisibility: "private",
        updatedAt
    });
    for (const privateField of [
        "email",
        "role",
        "totalUploads",
        "totalEarnings",
        "lastLoginAt"
    ]) {
        assert.equal(Object.hasOwn(clean, privateField), false);
    }
});

test("uses safe defaults and rejects invalid visibility values", () => {
    const clean = toPublicProfile(
        { email: "private@example.test", profileVisibility: "unknown" },
        { profileVisibility: "also-unknown", photoURL: { secret: true } },
        "now"
    );

    assert.equal(clean.displayName, "Student");
    assert.equal(clean.profileVisibility, "public");
    assert.equal(clean.photoURL, "");
    assert.equal(Object.hasOwn(clean, "email"), false);
});
