const COMMUNITY_NAME_MIN_LENGTH = 3;
const COMMUNITY_NAME_MAX_LENGTH = 80;
const COMMUNITY_DESCRIPTION_MAX_LENGTH = 1000;
const URL_PROTOCOL_PATTERN = /^https?:\/\//i;

export const COMMUNITY_CATEGORIES = Object.freeze([
    "academic",
    "arts",
    "club",
    "society",
    "sports",
    "study",
    "technology",
    "other"
]);

export const COMMUNITY_VISIBILITY_VALUES = Object.freeze([
    "public",
    "private",
    "unlisted"
]);

/**
 * Normalizes text for deterministic community lookup and comparison.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeCommunityText(value) {
    return String(value ?? "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("en");
}

/**
 * Validates and normalizes fields accepted when creating a community.
 *
 * Name uniqueness is intentionally checked by the community service because it
 * requires a remote data query.
 *
 * @param {object} input
 * @returns {{name: string, normalizedName: string, description: string, avatar: string|null, banner: string|null, visibility: string, category: string}}
 */
export function validateCommunityInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("Community data must be an object.");
    }

    const name = String(input.name ?? "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ");
    const description = String(input.description ?? "").trim();
    const category = normalizeCommunityText(input.category);

    if (name.length < COMMUNITY_NAME_MIN_LENGTH) {
        throw new TypeError(
            `Community name must be at least ${COMMUNITY_NAME_MIN_LENGTH} characters.`
        );
    }

    if (name.length > COMMUNITY_NAME_MAX_LENGTH) {
        throw new TypeError(
            `Community name must not exceed ${COMMUNITY_NAME_MAX_LENGTH} characters.`
        );
    }

    if (description.length > COMMUNITY_DESCRIPTION_MAX_LENGTH) {
        throw new TypeError(
            `Community description must not exceed ${COMMUNITY_DESCRIPTION_MAX_LENGTH} characters.`
        );
    }

    if (!COMMUNITY_CATEGORIES.includes(category)) {
        throw new TypeError(`Unsupported community category: ${category}.`);
    }

    if (!COMMUNITY_VISIBILITY_VALUES.includes(input.visibility)) {
        throw new TypeError(
            `Unsupported community visibility: ${input.visibility}.`
        );
    }

    return Object.freeze({
        name,
        normalizedName: normalizeCommunityText(name),
        description,
        avatar: validateOptionalUrl(input.avatar, "avatar"),
        banner: validateOptionalUrl(input.banner, "banner"),
        visibility: input.visibility,
        category
    });
}

/**
 * Validates a partial community update without inventing missing fields.
 *
 * @param {object} updates
 * @param {object} currentCommunity
 * @returns {object}
 */
export function validateCommunityUpdates(updates, currentCommunity) {
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
        throw new TypeError("Community updates must be an object.");
    }

    const allowedFields = new Set([
        "name",
        "description",
        "avatar",
        "banner",
        "visibility",
        "category"
    ]);
    const updateEntries = Object.entries(updates);

    if (!updateEntries.length) {
        throw new TypeError("At least one community field is required.");
    }

    for (const [field] of updateEntries) {
        if (!allowedFields.has(field)) {
            throw new TypeError(`Community field cannot be updated: ${field}.`);
        }
    }

    const validated = validateCommunityInput({
        ...currentCommunity,
        ...updates
    });

    return Object.freeze(
        Object.fromEntries(
            updateEntries.flatMap(([field]) => {
                if (field === "name") {
                    return [
                        ["name", validated.name],
                        ["normalizedName", validated.normalizedName]
                    ];
                }

                return [[field, validated[field]]];
            })
        )
    );
}

function validateOptionalUrl(value, fieldName) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const url = String(value).trim();

    if (!URL_PROTOCOL_PATTERN.test(url)) {
        throw new TypeError(`Community ${fieldName} must be an HTTP URL.`);
    }

    try {
        new URL(url);
    } catch {
        throw new TypeError(`Community ${fieldName} must be a valid URL.`);
    }

    return url;
}
