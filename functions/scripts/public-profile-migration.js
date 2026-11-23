"use strict";

function firstString(...values) {
    return (
        values
            .find(
                (value) => typeof value === "string" && value.trim().length > 0
            )
            ?.trim() || ""
    );
}

function toPublicProfile(user, serverTimestamp, existingProfile = {}) {
    // Prefer fields users have already edited in their public projection, but
    // copy only the explicit allowlist below. This also strips legacy/private
    // keys if an existing publicProfiles document contains them.
    const source = { ...user, ...existingProfile };
    const displayName = firstString(
        source.displayName,
        source.fullName,
        source.name,
        "Student"
    );

    return {
        displayName,
        fullName: firstString(source.fullName, displayName),
        name: firstString(source.name, displayName),
        photoURL: typeof source.photoURL === "string" ? source.photoURL : "",
        institution:
            typeof source.institution === "string" ? source.institution : "",
        course: typeof source.course === "string" ? source.course : "",
        yearOfStudy:
            typeof source.yearOfStudy === "string" ? source.yearOfStudy : "",
        bio: typeof source.bio === "string" ? source.bio : "",
        profileVisibility:
            source.profileVisibility === "private" ? "private" : "public",
        ...(source.joinedAt || source.createdAt
            ? { joinedAt: source.joinedAt || source.createdAt }
            : {}),
        ...(source.createdAt ? { createdAt: source.createdAt } : {}),
        updatedAt: serverTimestamp
    };
}

module.exports = { toPublicProfile };
