"use strict";

function firstString(...values) {
    return (
        values.find(
            (value) => typeof value === "string" && value.trim().length > 0
        )?.trim() || ""
    );
}

function toPublicProfile(user, serverTimestamp) {
    const displayName = firstString(
        user.displayName,
        user.fullName,
        user.name,
        "Student"
    );

    return {
        displayName,
        fullName: firstString(user.fullName, displayName),
        name: firstString(user.name, displayName),
        photoURL: typeof user.photoURL === "string" ? user.photoURL : "",
        institution:
            typeof user.institution === "string" ? user.institution : "",
        course: typeof user.course === "string" ? user.course : "",
        yearOfStudy:
            typeof user.yearOfStudy === "string" ? user.yearOfStudy : "",
        bio: typeof user.bio === "string" ? user.bio : "",
        profileVisibility:
            user.profileVisibility === "private" ? "private" : "public",
        ...(user.joinedAt || user.createdAt
            ? { joinedAt: user.joinedAt || user.createdAt }
            : {}),
        ...(user.createdAt ? { createdAt: user.createdAt } : {}),
        updatedAt: serverTimestamp
    };
}

module.exports = { toPublicProfile };
