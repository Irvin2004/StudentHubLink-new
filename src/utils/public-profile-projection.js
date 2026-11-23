const PUBLIC_PROFILE_FIELDS = [
    "displayName",
    "fullName",
    "name",
    "photoURL",
    "institution",
    "course",
    "yearOfStudy",
    "bio",
    "profileVisibility",
    "joinedAt",
    "createdAt"
];

function validText(value) {
    return typeof value === "string" ? value : "";
}

function validVisibility(value) {
    return value === "public" || value === "private" ? value : null;
}

/**
 * Builds a replacement public document from private source data and any
 * existing public edits. Unknown and private fields are deliberately omitted.
 */
export function toPublicProfile(source = {}, existing = {}, updatedAt = null) {
    const pickText = (field, fallback = "") =>
        validText(existing[field]) || validText(source[field]) || fallback;
    const displayName =
        pickText("displayName") ||
        pickText("fullName") ||
        pickText("name") ||
        validText(source.displayName) ||
        validText(source.fullName) ||
        validText(source.name) ||
        "Student";
    const result = {
        displayName,
        fullName: pickText("fullName", displayName) || displayName,
        name: pickText("name", displayName) || displayName,
        photoURL:
            typeof existing.photoURL === "string"
                ? existing.photoURL
                : typeof source.photoURL === "string"
                  ? source.photoURL
                  : "",
        institution: pickText("institution"),
        course: pickText("course"),
        yearOfStudy: pickText("yearOfStudy"),
        bio: pickText("bio"),
        profileVisibility:
            validVisibility(existing.profileVisibility) ||
            validVisibility(source.profileVisibility) ||
            "public",
        updatedAt
    };

    for (const field of ["joinedAt", "createdAt"]) {
        if (existing[field] != null) {
            result[field] = existing[field];
        } else if (source[field] != null) {
            result[field] = source[field];
        }
    }

    return Object.fromEntries(
        Object.entries(result).filter(
            ([key]) =>
                PUBLIC_PROFILE_FIELDS.includes(key) || key === "updatedAt"
        )
    );
}
