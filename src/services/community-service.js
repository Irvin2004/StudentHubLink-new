import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    endAt,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    startAt,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

import { COMMUNITY_ROLES } from "../config/community-roles.js";
import { ACTIVITY_TYPES } from "../config/activity-types.js";
import { CHANNEL_TYPES } from "../config/channel-types.js";
import { auth, db } from "../firebase/index.js";
import { createCommunityModel } from "../models/community.js";
import { createCommunityMemberModel } from "../models/community-member.js";
import {
    normalizeCommunityText,
    validateCommunityInput,
    validateCommunityUpdates
} from "../utils/community-validation.js";
import { createActivity } from "./activity-service.js";

const COMMUNITIES_COLLECTION = "communities";
const MEMBERS_COLLECTION = "members";
const CHILD_COLLECTIONS = Object.freeze([
    MEMBERS_COLLECTION,
    "channels",
    "settings"
]);
const DELETE_BATCH_SIZE = 400;
const DEFAULT_RESULT_LIMIT = 50;
const DEFAULT_CHANNEL_ID = "general";

function getAuthenticatedUserId(userId) {
    const resolvedUserId = userId || auth.currentUser?.uid;

    if (!resolvedUserId) {
        throw new Error("An authenticated user is required.");
    }

    return resolvedUserId;
}

function getCommunityReference(communityId) {
    if (!communityId) {
        throw new TypeError("A community ID is required.");
    }

    return doc(db, COMMUNITIES_COLLECTION, communityId);
}

function getMemberReference(communityId, userId) {
    if (!userId) {
        throw new TypeError("A community member user ID is required.");
    }

    return doc(
        db,
        COMMUNITIES_COLLECTION,
        communityId,
        MEMBERS_COLLECTION,
        userId
    );
}

function communityFromSnapshot(snapshot) {
    return createCommunityModel({
        id: snapshot.id,
        ...snapshot.data()
    });
}

function memberFromSnapshot(snapshot, communityId) {
    return createCommunityMemberModel({
        ...snapshot.data(),
        userId: snapshot.id,
        communityId
    });
}

async function assertUniqueCommunityName(normalizedName, excludedId = null) {
    const nameQuery = query(
        collection(db, COMMUNITIES_COLLECTION),
        where("normalizedName", "==", normalizedName),
        limit(2)
    );
    const snapshot = await getDocs(nameQuery);
    const duplicate = snapshot.docs.find(
        (communityDocument) => communityDocument.id !== excludedId
    );

    if (duplicate) {
        throw new Error("A community with this name already exists.");
    }
}

/**
 * Creates a community and its owner membership atomically.
 *
 * @param {object} input
 * @param {string} [ownerId]
 * @returns {Promise<Readonly<object>>}
 */
export async function createCommunity(input, ownerId) {
    const resolvedOwnerId = getAuthenticatedUserId(ownerId);
    const validated = validateCommunityInput({
        visibility: "public",
        ...input
    });

    await assertUniqueCommunityName(validated.normalizedName);

    const communityReference = doc(collection(db, COMMUNITIES_COLLECTION));
    const ownerReference = getMemberReference(
        communityReference.id,
        resolvedOwnerId
    );
    const generalChannelReference = doc(
        db,
        COMMUNITIES_COLLECTION,
        communityReference.id,
        "channels",
        DEFAULT_CHANNEL_ID
    );
    const timestamp = serverTimestamp();
    const communityData = {
        ...validated,
        ownerId: resolvedOwnerId,
        memberCount: 1,
        createdAt: timestamp,
        updatedAt: timestamp
    };
    const ownerData = {
        userId: resolvedOwnerId,
        communityId: communityReference.id,
        role: COMMUNITY_ROLES.OWNER,
        joinedAt: timestamp,
        nickname: null
    };
    const generalChannelData = {
        communityId: communityReference.id,
        name: DEFAULT_CHANNEL_ID,
        description: `General conversation for everyone in ${validated.name}.`,
        type: CHANNEL_TYPES.TEXT,
        createdBy: resolvedOwnerId,
        createdAt: timestamp,
        updatedAt: timestamp,
        position: 0
    };
    const batch = writeBatch(db);

    batch.set(communityReference, communityData);
    batch.set(ownerReference, ownerData);
    batch.set(generalChannelReference, generalChannelData);
    await batch.commit();

    return createCommunityModel({
        id: communityReference.id,
        ...communityData
    });
}

/**
 * Updates mutable community fields.
 *
 * @param {string} communityId
 * @param {object} updates
 * @returns {Promise<Readonly<object>>}
 */
export async function updateCommunity(communityId, updates) {
    const reference = getCommunityReference(communityId);
    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
        throw new Error("Community not found.");
    }

    const currentCommunity = communityFromSnapshot(snapshot);
    const validatedUpdates = validateCommunityUpdates(
        updates,
        currentCommunity
    );

    if (
        validatedUpdates.normalizedName &&
        validatedUpdates.normalizedName !== currentCommunity.normalizedName
    ) {
        await assertUniqueCommunityName(
            validatedUpdates.normalizedName,
            communityId
        );
    }

    const timestamp = serverTimestamp();

    await updateDoc(reference, {
        ...validatedUpdates,
        updatedAt: timestamp
    });

    return createCommunityModel({
        ...currentCommunity,
        ...validatedUpdates,
        updatedAt: timestamp
    });
}

/**
 * Deletes a community and all known domain subcollection documents.
 *
 * @param {string} communityId
 * @returns {Promise<void>}
 */
export async function deleteCommunity(communityId) {
    const reference = getCommunityReference(communityId);

    await Promise.all(
        CHILD_COLLECTIONS.map((collectionName) =>
            deleteCollectionDocuments(collection(reference, collectionName))
        )
    );
    await deleteDoc(reference);
}

/**
 * Adds the authenticated user to a community as a member.
 *
 * @param {string} communityId
 * @param {string} [userId]
 * @param {string|null} [nickname]
 * @returns {Promise<Readonly<object>>}
 */
export async function joinCommunity(communityId, userId, nickname = null) {
    const result = await persistMember(
        communityId,
        {
            userId: getAuthenticatedUserId(userId),
            role: COMMUNITY_ROLES.MEMBER,
            nickname
        },
        { allowExisting: true }
    );

    if (result.created) {
        const actorName =
            String(
                nickname ||
                    auth.currentUser?.displayName ||
                    auth.currentUser?.email?.split("@")[0] ||
                    "A student"
            ).trim() || "A student";

        void createActivity(communityId, {
            type: ACTIVITY_TYPES.MEMBER_JOINED,
            actorId: result.member.userId,
            actorName,
            title: `${actorName} joined the community`,
            description: "A new member is ready to participate.",
            referenceId: result.member.userId
        }).catch(() => {});
    }

    return result.member;
}

/**
 * Removes the authenticated user's membership.
 *
 * @param {string} communityId
 * @param {string} [userId]
 * @returns {Promise<void>}
 */
export function leaveCommunity(communityId, userId) {
    return removeMember(communityId, getAuthenticatedUserId(userId));
}

/**
 * Loads one community.
 *
 * @param {string} communityId
 * @returns {Promise<Readonly<object>|null>}
 */
export async function getCommunity(communityId) {
    const snapshot = await getDoc(getCommunityReference(communityId));

    return snapshot.exists() ? communityFromSnapshot(snapshot) : null;
}

/**
 * Loads a single membership when it exists.
 *
 * @param {string} communityId
 * @param {string} userId
 * @returns {Promise<Readonly<object>|null>}
 */
export async function getCommunityMember(communityId, userId) {
    const snapshot = await getDoc(getMemberReference(communityId, userId));

    return snapshot.exists() ? memberFromSnapshot(snapshot, communityId) : null;
}

/**
 * Loads community IDs for memberships owned by one user.
 *
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getCommunityMembershipIds(userId) {
    const resolvedUserId = getAuthenticatedUserId(userId);
    const membershipQuery = query(
        collectionGroup(db, MEMBERS_COLLECTION),
        where("userId", "==", resolvedUserId),
        limit(100)
    );
    const snapshot = await getDocs(membershipQuery);

    return snapshot.docs
        .map((membershipDocument) => membershipDocument.ref?.parent?.parent?.id)
        .filter(Boolean);
}

/**
 * Lists communities using optional visibility and category filters.
 *
 * @param {{visibility?: string, category?: string, maxResults?: number}} [options]
 * @returns {Promise<Readonly<object>[]>}
 */
export async function getCommunities(options = {}) {
    const constraints = [];

    if (options.visibility) {
        constraints.push(where("visibility", "==", options.visibility));
    }

    if (options.category) {
        constraints.push(
            where("category", "==", normalizeCommunityText(options.category))
        );
    }

    constraints.push(
        orderBy("updatedAt", "desc"),
        limit(toResultLimit(options.maxResults))
    );

    const snapshot = await getDocs(
        query(collection(db, COMMUNITIES_COLLECTION), ...constraints)
    );

    return snapshot.docs.map(communityFromSnapshot);
}

/**
 * Performs a case-insensitive community name prefix search.
 *
 * @param {string} searchTerm
 * @param {{maxResults?: number}} [options]
 * @returns {Promise<Readonly<object>[]>}
 */
export async function searchCommunities(searchTerm, options = {}) {
    const normalizedTerm = normalizeCommunityText(searchTerm);

    if (!normalizedTerm) {
        return [];
    }

    const searchQuery = query(
        collection(db, COMMUNITIES_COLLECTION),
        orderBy("normalizedName"),
        startAt(normalizedTerm),
        endAt(`${normalizedTerm}\uf8ff`),
        limit(toResultLimit(options.maxResults))
    );
    const snapshot = await getDocs(searchQuery);

    return snapshot.docs.map(communityFromSnapshot);
}

/**
 * Adds a member with an explicitly assigned role.
 *
 * @param {string} communityId
 * @param {{userId: string, role?: string, nickname?: string|null}} member
 * @returns {Promise<Readonly<object>>}
 */
export async function addMember(communityId, member) {
    const result = await persistMember(communityId, member, {
        allowExisting: false
    });
    return result.member;
}

/**
 * Removes a non-owner member and updates the aggregate member count.
 *
 * @param {string} communityId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function removeMember(communityId, userId) {
    const communityReference = getCommunityReference(communityId);
    const memberReference = getMemberReference(communityId, userId);

    await runTransaction(db, async (transaction) => {
        const [communitySnapshot, memberSnapshot] = await Promise.all([
            transaction.get(communityReference),
            transaction.get(memberReference)
        ]);

        if (!communitySnapshot.exists()) {
            throw new Error("Community not found.");
        }

        if (!memberSnapshot.exists()) return;

        const member = memberFromSnapshot(memberSnapshot, communityId);

        if (member.role === COMMUNITY_ROLES.OWNER) {
            throw new Error(
                "The community owner cannot leave without transferring ownership."
            );
        }

        transaction.delete(memberReference);
        transaction.update(communityReference, {
            memberCount: Math.max(
                0,
                Number(communitySnapshot.data().memberCount || 0) - 1
            ),
            updatedAt: serverTimestamp()
        });
    });
}

/**
 * Changes a non-owner member's role.
 *
 * @param {string} communityId
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<Readonly<object>>}
 */
export async function updateMemberRole(communityId, userId, role) {
    if (role === COMMUNITY_ROLES.OWNER) {
        throw new Error(
            "Ownership transfers require a dedicated ownership workflow."
        );
    }

    const memberReference = getMemberReference(communityId, userId);
    const snapshot = await getDoc(memberReference);

    if (!snapshot.exists()) {
        throw new Error("Community member not found.");
    }

    const currentMember = memberFromSnapshot(snapshot, communityId);

    if (currentMember.role === COMMUNITY_ROLES.OWNER) {
        throw new Error("The community owner's role cannot be changed.");
    }

    const updatedMember = createCommunityMemberModel({
        ...currentMember,
        role
    });

    await setDoc(
        memberReference,
        {
            role: updatedMember.role
        },
        { merge: true }
    );

    return updatedMember;
}

async function persistMember(communityId, member, { allowExisting }) {
    const communityReference = getCommunityReference(communityId);
    const memberReference = getMemberReference(communityId, member?.userId);
    let persistedMember = null;
    let created = false;

    await runTransaction(db, async (transaction) => {
        const [communitySnapshot, memberSnapshot] = await Promise.all([
            transaction.get(communityReference),
            transaction.get(memberReference)
        ]);

        if (!communitySnapshot.exists()) {
            throw new Error("Community not found.");
        }

        if (memberSnapshot.exists()) {
            if (!allowExisting) {
                throw new Error("User is already a community member.");
            }

            persistedMember = memberFromSnapshot(memberSnapshot, communityId);
            return;
        }

        const timestamp = serverTimestamp();

        persistedMember = createCommunityMemberModel({
            ...member,
            communityId,
            joinedAt: timestamp
        });

        transaction.set(memberReference, persistedMember);
        created = true;
        transaction.update(communityReference, {
            memberCount: Number(communitySnapshot.data().memberCount || 0) + 1,
            updatedAt: timestamp
        });
    });

    return { created, member: persistedMember };
}

async function deleteCollectionDocuments(collectionReference) {
    let hasMore = true;

    while (hasMore) {
        const snapshot = await getDocs(
            query(collectionReference, limit(DELETE_BATCH_SIZE))
        );

        if (snapshot.empty) return;

        const batch = writeBatch(db);

        snapshot.docs.forEach((documentSnapshot) => {
            batch.delete(documentSnapshot.ref);
        });
        await batch.commit();

        hasMore = snapshot.size === DELETE_BATCH_SIZE;
    }
}

function toResultLimit(value) {
    const parsed = Number(value ?? DEFAULT_RESULT_LIMIT);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        throw new TypeError(
            "Community result limit must be an integer from 1 to 100."
        );
    }

    return parsed;
}
