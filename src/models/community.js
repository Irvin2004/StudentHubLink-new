import {
    COMMUNITY_VISIBILITY_VALUES,
    validateCommunityInput
} from "../utils/community-validation.js";

export { COMMUNITY_VISIBILITY_VALUES };

export const COMMUNITY_VISIBILITY = Object.freeze({
    PUBLIC: "public",
    PRIVATE: "private",
    UNLISTED: "unlisted"
});

/**
 * Creates an immutable, normalized community model.
 *
 * @param {object} data
 * @returns {Readonly<object>}
 */
export function createCommunityModel(data = {}) {
    if (!data.id) {
        throw new TypeError("A community ID is required.");
    }

    if (!data.ownerId) {
        throw new TypeError("A community owner ID is required.");
    }

    if (!COMMUNITY_VISIBILITY_VALUES.includes(data.visibility)) {
        throw new TypeError(
            `Unsupported community visibility: ${data.visibility}.`
        );
    }

    const validated = validateCommunityInput(data);
    const memberCount = Number(data.memberCount);

    if (!Number.isInteger(memberCount) || memberCount < 0) {
        throw new TypeError(
            "Community member count must be a non-negative integer."
        );
    }

    return Object.freeze({
        id: String(data.id),
        name: validated.name,
        normalizedName: validated.normalizedName,
        description: validated.description,
        normalizedDescription: validated.normalizedDescription,
        avatar: validated.avatar,
        banner: validated.banner,
        ownerId: String(data.ownerId),
        visibility: validated.visibility,
        category: validated.category,
        memberCount,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null
    });
}

/**
 * Community model convenience class.
 */
export class Community {
    constructor(data) {
        Object.assign(this, createCommunityModel(data));
        Object.freeze(this);
    }
}
