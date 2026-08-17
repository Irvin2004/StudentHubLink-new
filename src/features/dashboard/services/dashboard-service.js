import { collection, getDocs, limit, query, where } from "firebase/firestore";

import { db } from "../../../firebase/index.js";
import { getCommunityMembershipIds } from "../../../services/community-service.js";

const CONVERSATION_LIMIT = 100;

function unreadMessageCount(conversation, userId) {
    return Math.max(0, Number(conversation?.unreadCounts?.[userId]) || 0);
}

async function getConversationStats(userId, communityIds) {
    const conversations = new Map();
    const directSnapshot = await getDocs(
        query(
            collection(db, "conversations"),
            where("participantIds", "array-contains", userId),
            limit(CONVERSATION_LIMIT)
        )
    );
    directSnapshot.docs.forEach((conversationDocument) =>
        conversations.set(conversationDocument.id, conversationDocument.data())
    );

    for (let index = 0; index < communityIds.length; index += 30) {
        const groupSnapshot = await getDocs(
            query(
                collection(db, "conversations"),
                where("groupId", "in", communityIds.slice(index, index + 30)),
                limit(CONVERSATION_LIMIT)
            )
        );
        groupSnapshot.docs.forEach((conversationDocument) =>
            conversations.set(
                conversationDocument.id,
                conversationDocument.data()
            )
        );
    }

    return [...conversations.values()].reduce(
        (total, conversation) =>
            total + unreadMessageCount(conversation, userId),
        0
    );
}

export async function getDashboard(userId) {
    const communityIds = userId ? await getCommunityMembershipIds(userId) : [];
    const messages = userId
        ? await getConversationStats(userId, communityIds)
        : 0;

    return {
        greeting: {
            name: "",
            message: "Ready to continue learning?"
        },
        stats: {
            communities: communityIds.length,
            messages
        },
        activity: [],
        quickActions: [],
        aiSuggestions: []
    };
}
