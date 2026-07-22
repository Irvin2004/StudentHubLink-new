import { getStudyGroupMembers } from "../services/group-service.js";

const GROUP_MEMBER_CACHE_TTL = 30_000;
const groupMemberCache = new Map();

export function cleanEventId(value) {
    return typeof value === "string" ? value.trim() : "";
}

export function uniqueEventRecipients(recipientIds, excludedId) {
    const cleanExcludedId = cleanEventId(excludedId);
    return Array.from(new Set(
        recipientIds
            .map(cleanEventId)
            .filter((recipientId) => (
                recipientId && recipientId !== cleanExcludedId
            ))
    ));
}

export async function getGroupEventRecipients(groupId, excludedId) {
    const cleanGroupId = cleanEventId(groupId);
    const cached = groupMemberCache.get(cleanGroupId);
    let memberIds;

    if (cached && Date.now() - cached.loadedAt < GROUP_MEMBER_CACHE_TTL) {
        memberIds = cached.memberIds;
    } else {
        const members = await getStudyGroupMembers(cleanGroupId);
        memberIds = members.map((member) => member.userId || member.id);
        groupMemberCache.set(cleanGroupId, {
            memberIds,
            loadedAt: Date.now()
        });
    }

    return uniqueEventRecipients(memberIds, excludedId);
}
