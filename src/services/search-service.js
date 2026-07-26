import {
    collection,
    collectionGroup,
    endAt,
    getDocs,
    limit,
    orderBy,
    query,
    startAt
} from "firebase/firestore";

import { db } from "../firebase/firestore.js";

const COMMUNITIES = "communities";
const CHANNELS = "channels";
const FILES = "files";
const MINIMUM_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

function normalizeTerm(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function resultLimit(value) {
    const parsed = Number(value ?? DEFAULT_LIMIT);
    return Number.isInteger(parsed) && parsed > 0
        ? Math.min(parsed, MAX_LIMIT)
        : DEFAULT_LIMIT;
}

function prefixQuery(reference, field, term, maxResults) {
    return query(
        reference,
        orderBy(field),
        startAt(term),
        endAt(`${term}\uf8ff`),
        limit(resultLimit(maxResults))
    );
}

function communityResult(snapshot) {
    const data = snapshot.data();
    return Object.freeze({
        id: snapshot.id,
        type: "community",
        title: data.name || "Untitled community",
        subtitle: data.category || data.description || "Community",
        icon: "community",
        url: `/community/${snapshot.id}`
    });
}

function channelResult(snapshot) {
    const data = snapshot.data();
    const communityId =
        data.communityId || snapshot.ref?.parent?.parent?.id || "";
    return Object.freeze({
        id: snapshot.id,
        type: "channel",
        title: `#${data.name || snapshot.id}`,
        subtitle: data.description || "Channel",
        icon: "channel",
        url: `/community/${communityId}/channel/${snapshot.id}`
    });
}

function fileResult(snapshot) {
    const data = snapshot.data();
    const channelReference = snapshot.ref?.parent?.parent;
    const channelId = data.channelId || channelReference?.id || "";
    const communityId =
        data.communityId || channelReference?.parent?.parent?.id || "";
    return Object.freeze({
        id: snapshot.id,
        type: "file",
        title:
            data.filename || data.originalName || data.name || "Untitled file",
        subtitle: data.uploadedByName || `#${channelId}`,
        icon: "file",
        url: `/community/${communityId}/channel/${channelId}?view=files&file=${snapshot.id}`
    });
}

async function executePrefixSearch({
    collectionReference,
    field,
    mapper,
    maxResults,
    searchTerm
}) {
    const term = normalizeTerm(searchTerm);
    if (term.length < MINIMUM_QUERY_LENGTH) return [];

    const snapshot = await getDocs(
        prefixQuery(collectionReference, field, term, maxResults)
    );
    return snapshot.docs.map(mapper);
}

export function searchCommunities(searchTerm, options = {}) {
    return executePrefixSearch({
        collectionReference: collection(db, COMMUNITIES),
        field: "normalizedName",
        mapper: communityResult,
        maxResults: options.maxResults,
        searchTerm
    });
}

export function searchChannels(searchTerm, options = {}) {
    return executePrefixSearch({
        collectionReference: collectionGroup(db, CHANNELS),
        field: "name",
        mapper: channelResult,
        maxResults: options.maxResults,
        searchTerm
    });
}

export function searchFiles(searchTerm, options = {}) {
    return executePrefixSearch({
        collectionReference: collectionGroup(db, FILES),
        field: "normalizedFilename",
        mapper: fileResult,
        maxResults: options.maxResults,
        searchTerm
    });
}

export async function globalSearch(searchTerm, options = {}) {
    const term = normalizeTerm(searchTerm);
    if (term.length < MINIMUM_QUERY_LENGTH) {
        return { communities: [], channels: [], files: [] };
    }

    const [communities, channels, files] = await Promise.all([
        searchCommunities(term, options),
        searchChannels(term, options),
        searchFiles(term, options)
    ]);

    return Object.freeze({ communities, channels, files });
}
