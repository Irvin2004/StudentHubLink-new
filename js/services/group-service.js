import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    serverTimestamp,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export const GROUP_VISIBILITY = Object.freeze({
    PUBLIC: "public",
    PRIVATE: "private"
});

export const GROUP_ROLES = Object.freeze({
    OWNER: "owner",
    ADMIN: "admin",
    MODERATOR: "moderator",
    MEMBER: "member"
});

function normalizeGroupTags(tags = []) {
    const source = Array.isArray(tags)
        ? tags
        : String(tags).split(",");

    const uniqueTags = [];
    const seenTags = new Set();

    source.forEach((value) => {
        const tag = String(value)
            .trim()
            .replace(/^#+/, "");

        if (!tag) {
            return;
        }

        if (tag.length > 24) {
            throw new Error(
                "Each group tag must be 24 characters or fewer."
            );
        }

        const key = tag.toLowerCase();

        if (!seenTags.has(key)) {
            seenTags.add(key);
            uniqueTags.push(tag);
        }
    });

    if (uniqueTags.length > 5) {
        throw new Error("Add no more than 5 group tags.");
    }

    return uniqueTags;
}

export async function createStudyGroup({
    name,
    description,
    moduleCode,
    moduleName,
    tags = [],
    visibility = GROUP_VISIBILITY.PUBLIC,
    owner
}) {
    const cleanName = name?.trim();
    const cleanDescription = description?.trim();
    const cleanModuleCode =
        moduleCode?.trim().toUpperCase() || "";
    const cleanModuleName = moduleName?.trim();
    const cleanVisibility = visibility?.trim().toLowerCase();
    const cleanTags = normalizeGroupTags(tags);
    const ownerDisplayName = (
        owner?.displayName ||
        owner?.email ||
        "Student"
    ).trim();

    if (!cleanName) {
        throw new Error("Group name is required.");
    }

    if (cleanName.length < 4) {
        throw new Error(
            "Group name must be at least 4 characters."
        );
    }

    if (!cleanModuleName) {
        throw new Error("Module or subject name is required.");
    }

    if (!owner?.uid) {
        throw new Error("A signed-in owner is required.");
    }

    if (!Object.values(GROUP_VISIBILITY).includes(cleanVisibility)) {
        throw new Error("Choose a valid group visibility.");
    }

    if (cleanName.length > 100) {
        throw new Error(
            "Group name cannot exceed 100 characters."
        );
    }

    if ((cleanDescription || "").length > 1000) {
        throw new Error(
            "Description cannot exceed 1000 characters."
        );
    }

    if (cleanModuleCode.length > 30) {
        throw new Error(
            "Module code cannot exceed 30 characters."
        );
    }

    if (cleanModuleName.length > 120) {
        throw new Error(
            "Module name cannot exceed 120 characters."
        );
    }

    const groupRef = doc(
        collection(db, COLLECTIONS.GROUPS)
    );
    const ownerMemberRef = doc(
        db,
        COLLECTIONS.GROUPS,
        groupRef.id,
        "members",
        owner.uid
    );
    const batch = writeBatch(db);

    batch.set(groupRef, {
        name: cleanName,
        description: cleanDescription || "",
        moduleCode: cleanModuleCode,
        moduleName: cleanModuleName,
        tags: cleanTags,
        ownerId: owner.uid,
        visibility: cleanVisibility,
        photoURL: "",
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    batch.set(ownerMemberRef, {
        userId: owner.uid,
        displayName: ownerDisplayName.slice(0, 120),
        photoURL: owner.photoURL || "",
        role: GROUP_ROLES.OWNER,
        joinedAt: serverTimestamp()
    });

    await batch.commit();

    return groupRef.id;
}

export async function getStudyGroup(groupId) {
    const cleanGroupId = groupId?.trim();

    if (!cleanGroupId) {
        throw new Error("Group ID is required.");
    }

    const groupSnapshot = await getDoc(
        doc(db, COLLECTIONS.GROUPS, cleanGroupId)
    );

    if (!groupSnapshot.exists()) {
        throw new Error("Study group not found.");
    }

    return {
        id: groupSnapshot.id,
        ...groupSnapshot.data()
    };
}

export async function getStudyGroups() {
    const publicGroupsQuery = query(
        collection(db, COLLECTIONS.GROUPS),
        where("visibility", "==", GROUP_VISIBILITY.PUBLIC)
    );
    const snapshot = await getDocs(publicGroupsQuery);

    return snapshot.docs
        .map((groupDocument) => ({
            id: groupDocument.id,
            ...groupDocument.data()
        }))
        .sort((firstGroup, secondGroup) =>
            firstGroup.name.localeCompare(secondGroup.name)
        );
}

export async function getStudyGroupMemberships(
    groupIds,
    userId
) {
    if (!userId || !Array.isArray(groupIds)) {
        return new Set();
    }

    const membershipChecks = await Promise.all(
        groupIds.map(async (groupId) => {
            const snapshot = await getDoc(
                doc(
                    db,
                    COLLECTIONS.GROUPS,
                    groupId,
                    "members",
                    userId
                )
            );

            return snapshot.exists() ? groupId : null;
        })
    );

    return new Set(membershipChecks.filter(Boolean));
}

export async function getStudyGroupMembers(groupId) {
    if (!groupId) {
        return [];
    }

    const snapshot = await getDocs(
        collection(
            db,
            COLLECTIONS.GROUPS,
            groupId,
            "members"
        )
    );

    return snapshot.docs.map((memberDocument) => ({
        id: memberDocument.id,
        ...memberDocument.data()
    }));
}

export async function joinStudyGroup({
    groupId,
    user
}) {
    if (!groupId) {
        throw new Error("Group ID is required.");
    }

    if (!user?.uid) {
        throw new Error("Sign in before joining a group.");
    }

    const groupRef = doc(
        db,
        COLLECTIONS.GROUPS,
        groupId
    );

    const memberRef = doc(
        db,
        COLLECTIONS.GROUPS,
        groupId,
        "members",
        user.uid
    );

    return runTransaction(db, async (transaction) => {
        const [groupSnapshot, memberSnapshot] =
        await Promise.all([
            transaction.get(groupRef),
            transaction.get(memberRef)
        ]);

        if (!groupSnapshot.exists()) {
            throw new Error("Study group not found.");
        }

        if (memberSnapshot.exists()) {
            return false;
        }

        const group = groupSnapshot.data();

        if (group.visibility !== GROUP_VISIBILITY.PUBLIC) {
            throw new Error(
                "Private groups require an invitation."
            );
        }

        transaction.set(memberRef, {
            userId: user.uid,
            displayName: (
                user.displayName ||
                user.email ||
                "Student"
            ).trim().slice(0, 120),
            photoURL: user.photoURL || "",
            role: GROUP_ROLES.MEMBER,
            joinedAt: serverTimestamp()
        });

        transaction.update(groupRef, {
            memberCount:
                Number(group.memberCount || 0) + 1,
            updatedAt: serverTimestamp()
        });

        return true;
    });
}
export async function leaveStudyGroup({
    groupId,
    userId
}) {
    if (!groupId) {
        throw new Error("Group ID is required.");
    }

    if (!userId) {
        throw new Error("A signed-in member is required.");
    }

    const groupRef = doc(
        db,
        COLLECTIONS.GROUPS,
        groupId
    );

    const memberRef = doc(
        db,
        COLLECTIONS.GROUPS,
        groupId,
        "members",
        userId
    );

    return runTransaction(db, async (transaction) => {
        const [groupSnapshot, memberSnapshot] =
        await Promise.all([
            transaction.get(groupRef),
            transaction.get(memberRef)
        ]);

        if (!groupSnapshot.exists()) {
            throw new Error("Study group not found.");
        }

        if (!memberSnapshot.exists()) {
            return false;
        }

        const group = groupSnapshot.data();
        const member = memberSnapshot.data();

        if (
            group.ownerId === userId ||
            member.role === GROUP_ROLES.OWNER
        ) {
            throw new Error(
                "Group owners cannot leave their own group."
            );
        }

        const memberCount =
            Number(group.memberCount || 0);

        if (memberCount <= 1) {
            throw new Error(
                "The group membership count is invalid."
            );
        }

        transaction.delete(memberRef);

        transaction.update(groupRef, {
            memberCount: memberCount - 1,
            updatedAt: serverTimestamp()
        });

        return true;
    });
}