"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    toPublicProfile
} = require("../functions/scripts/public-profile-migration");

test("copies only approved presentation fields", () => {
    const timestamp = { sentinel: "server timestamp" };
    const profile = toPublicProfile(
        {
            displayName: "  Ada Lovelace  ",
            fullName: "Ada Lovelace",
            name: "Ada",
            photoURL: "https://example.test/avatar.png",
            institution: "University",
            course: "Computing",
            yearOfStudy: "2",
            bio: "Hello",
            profileVisibility: "private",
            email: "private@example.test",
            role: "admin",
            accountStatus: "suspended",
            totalDownloads: 99,
            earnings: 1000,
            joinedAt: "joined",
            createdAt: "created",
            lastLoginAt: "private timestamp"
        },
        timestamp
    );

    assert.deepEqual(profile, {
        displayName: "Ada Lovelace",
        fullName: "Ada Lovelace",
        name: "Ada",
        photoURL: "https://example.test/avatar.png",
        institution: "University",
        course: "Computing",
        yearOfStudy: "2",
        bio: "Hello",
        profileVisibility: "private",
        joinedAt: "joined",
        createdAt: "created",
        updatedAt: timestamp
    });
});

test("defaults missing names and visibility safely", () => {
    const profile = toPublicProfile(
        { email: "private@example.test", profileVisibility: "unknown" },
        "server-time"
    );

    assert.equal(profile.displayName, "Student");
    assert.equal(profile.fullName, "Student");
    assert.equal(profile.name, "Student");
    assert.equal(profile.profileVisibility, "public");
    assert.equal(profile.updatedAt, "server-time");
    assert.equal("email" in profile, false);
    assert.equal("role" in profile, false);
});

test("does not copy non-string presentation values", () => {
    const profile = toPublicProfile(
        {
            displayName: 123,
            photoURL: { url: "private" },
            institution: null,
            course: 42,
            yearOfStudy: false,
            bio: []
        },
        null
    );

    assert.equal(profile.displayName, "Student");
    assert.equal(profile.photoURL, "");
    assert.equal(profile.institution, "");
    assert.equal(profile.course, "");
    assert.equal(profile.yearOfStudy, "");
    assert.equal(profile.bio, "");
});
