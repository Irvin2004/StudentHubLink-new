import { CHANNEL_TYPES, CHANNEL_TYPE_VALUES } from "../config/channel-types.js";

export const RESERVED_CHANNEL_NAMES = Object.freeze(["general"]);
export const CHANNEL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeChannelName(value = "") {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export function validateChannelInput(input = {}, options = {}) {
    const name = normalizeChannelName(input.name);
    const description = String(input.description || "").trim();
    const type = input.type || CHANNEL_TYPES.TEXT;
    const allowReserved = options.allowReserved === true;

    if (!name) {
        throw new TypeError("Channel name is required.");
    }

    if (name.length > 80 || !CHANNEL_NAME_PATTERN.test(name)) {
        throw new TypeError(
            "Use lowercase letters, numbers, and hyphens for the channel name."
        );
    }

    if (!allowReserved && RESERVED_CHANNEL_NAMES.includes(name)) {
        throw new TypeError("#general is reserved for the default channel.");
    }

    if (description.length > 120) {
        throw new TypeError(
            "Channel description must be 120 characters or fewer."
        );
    }

    if (!CHANNEL_TYPE_VALUES.includes(type)) {
        throw new TypeError(`Unsupported channel type: ${type}.`);
    }

    return Object.freeze({ name, description, type });
}

export function createChannelModel(data = {}) {
    if (!data.id) {
        throw new TypeError("A channel ID is required.");
    }

    if (!data.communityId) {
        throw new TypeError("A community ID is required.");
    }

    if (!data.createdBy) {
        throw new TypeError("A channel creator ID is required.");
    }

    const validated = validateChannelInput(data, {
        allowReserved: data.id === "general" && data.name === "general"
    });
    const position = Number(data.position ?? 0);

    if (!Number.isFinite(position) || position < 0) {
        throw new TypeError("Channel position must be a non-negative number.");
    }

    return Object.freeze({
        id: String(data.id),
        communityId: String(data.communityId),
        name: validated.name,
        description: validated.description,
        type: validated.type,
        createdBy: String(data.createdBy),
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
        position
    });
}

export class Channel {
    constructor(data) {
        Object.assign(this, createChannelModel(data));
        Object.freeze(this);
    }
}
