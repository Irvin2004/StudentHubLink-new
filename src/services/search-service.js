import {
    collection,
    collectionGroup,
    endAt,
    getDocs,
    limit,
    orderBy,
    query,
    startAt,
    where
} from "firebase/firestore";

import { toChannelSearchResult } from "../adapters/channel-search-adapter.js";
import { toCommunitySearchResult } from "../adapters/community-search-adapter.js";
import { toFileSearchResult } from "../adapters/file-search-adapter.js";
import { db } from "../firebase/firestore.js";

const COMMUNITIES = "communities";
const CHANNELS = "channels";
const FILES = "files";
const MINIMUM_QUERY_LENGTH = 2;
const RESULT_LIMIT = 5;
const GLOBAL_RESULT_LIMIT = 15;
const SEARCH_ERROR_MESSAGE = "Unable to search StudentHub.";
const ALL_TYPES = Object.freeze(["community", "channel", "file"]);

function normalizeTerm(value) {
    return String(value ?? "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("en");
}

function prefixQuery(reference, field, term) {
    return query(
        reference,
        orderBy(field),
        startAt(term),
        endAt(`${term}\uf8ff`),
        limit(RESULT_LIMIT)
    );
}

function exactArrayMatchQuery(reference, field, term) {
    return query(
        reference,
        where(field, "array-contains", term),
        limit(RESULT_LIMIT)
    );
}

function resultScore(data, term, titleFields, secondaryFields) {
    const title = titleFields
        .map((field) => normalizeTerm(data[field]))
        .find(Boolean);

    if (title?.startsWith(term)) return 100;
    if (title?.includes(term)) return 70;

    const secondaryMatch = secondaryFields.some((field) => {
        const value = data[field];
        const candidates = Array.isArray(value) ? value : [value];
        return candidates.some((candidate) =>
            normalizeTerm(candidate).includes(term)
        );
    });

    return secondaryMatch ? 40 : 0;
}

function scoredResult(snapshot, adapter, score) {
    return {
        result: adapter(snapshot),
        score
    };
}

function mergeScoredResults(groups) {
    const unique = new Map();

    groups.flat().forEach((entry) => {
        const key = `${entry.result.type}:${entry.result.url}`;
        const current = unique.get(key);
        if (!current || entry.score > current.score) unique.set(key, entry);
    });

    return [...unique.values()]
        .filter(({ score }) => score > 0)
        .sort(
            (left, right) =>
                right.score - left.score ||
                left.result.title.localeCompare(right.result.title)
        )
        .slice(0, RESULT_LIMIT);
}

function publicResults(scoredResults) {
    return scoredResults.map(({ result }) => result);
}

function selectedTypes(filters) {
    if (!filters || filters === "all") return ALL_TYPES;

    const requested = Array.isArray(filters)
        ? filters
        : Array.isArray(filters.types)
          ? filters.types
          : [filters.type || filters.filter || filters];

    return ALL_TYPES.filter((type) => requested.includes(type));
}

async function findCommunities(term) {
    const reference = collection(db, COMMUNITIES);
    const [nameSnapshot, descriptionSnapshot] = await Promise.all([
        getDocs(prefixQuery(reference, "normalizedName", term)),
        getDocs(prefixQuery(reference, "normalizedDescription", term))
    ]);

    return mergeScoredResults(
        [nameSnapshot.docs, descriptionSnapshot.docs].map((documents) =>
            documents.map((snapshot) => {
                const data = snapshot.data();
                return scoredResult(
                    snapshot,
                    toCommunitySearchResult,
                    resultScore(
                        data,
                        term,
                        ["name", "normalizedName"],
                        ["description", "normalizedDescription"]
                    )
                );
            })
        )
    );
}

async function findChannels(term) {
    const snapshot = await getDocs(
        prefixQuery(collectionGroup(db, CHANNELS), "name", term)
    );

    return mergeScoredResults([
        snapshot.docs.map((documentSnapshot) => {
            const data = documentSnapshot.data();
            return scoredResult(
                documentSnapshot,
                toChannelSearchResult,
                resultScore(data, term, ["name"], ["description"])
            );
        })
    ]);
}

async function findFiles(term) {
    const reference = collectionGroup(db, FILES);
    const [filenameSnapshot, tagsSnapshot] = await Promise.all([
        getDocs(prefixQuery(reference, "normalizedFilename", term)),
        getDocs(exactArrayMatchQuery(reference, "tags", term))
    ]);

    return mergeScoredResults(
        [filenameSnapshot.docs, tagsSnapshot.docs].map((documents) =>
            documents.map((snapshot) => {
                const data = snapshot.data();
                return scoredResult(
                    snapshot,
                    toFileSearchResult,
                    resultScore(
                        data,
                        term,
                        ["filename", "originalName", "name"],
                        ["tags"]
                    )
                );
            })
        )
    );
}

async function safelySearch(searchTerm, search) {
    const term = normalizeTerm(searchTerm);
    if (term.length < MINIMUM_QUERY_LENGTH) return [];

    try {
        return publicResults(await search(term));
    } catch {
        throw new Error(SEARCH_ERROR_MESSAGE);
    }
}

export function searchCommunities(searchTerm) {
    return safelySearch(searchTerm, findCommunities);
}

export function searchChannels(searchTerm) {
    return safelySearch(searchTerm, findChannels);
}

export function searchFiles(searchTerm) {
    return safelySearch(searchTerm, findFiles);
}

export async function globalSearch(searchTerm, filters = "all") {
    const term = normalizeTerm(searchTerm);
    if (term.length < MINIMUM_QUERY_LENGTH) return [];

    const types = selectedTypes(filters);
    const searches = {
        channel: findChannels,
        community: findCommunities,
        file: findFiles
    };

    try {
        const groups = await Promise.all(
            types.map((type) => searches[type](term))
        );

        return groups
            .flat()
            .sort(
                (left, right) =>
                    right.score - left.score ||
                    left.result.title.localeCompare(right.result.title)
            )
            .slice(0, GLOBAL_RESULT_LIMIT)
            .map(({ result }) => result);
    } catch {
        throw new Error(SEARCH_ERROR_MESSAGE);
    }
}
