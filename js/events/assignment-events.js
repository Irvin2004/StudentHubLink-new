import { NOTIFICATION_TYPES } from "../config/notification-types.js";
import { getStudyGroupMembers } from "../services/group-service.js";
import { createNotification } from "../services/notification-service.js";
import { error as logError } from "../utils/logger.js";

function cleanId(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

async function getAssignmentRecipients(groupId, creatorId) {
    const members = await getStudyGroupMembers(groupId);
    const cleanCreatorId = cleanId(creatorId);

    return Array.from(new Set(
        members
            .map((member) => cleanId(member.userId || member.id))
            .filter((memberId) => (
                memberId && memberId !== cleanCreatorId
            ))
    ));
}

export async function emitAssignmentCreated({
    assignment,
    groupId,
    creatorId
} = {}) {
    try {
        const cleanGroupId = cleanId(groupId);
        const cleanCreatorId = cleanId(creatorId);
        const recipients = await getAssignmentRecipients(
            cleanGroupId,
            cleanCreatorId
        );
        const deliveries = await Promise.all(
            recipients.map(async (recipientId) => {
                try {
                    await createNotification({
                        type: NOTIFICATION_TYPES.NEW_ASSIGNMENT,
                        recipientId,
                        senderId: cleanCreatorId,
                        groupId: cleanGroupId,
                        referenceId: assignment.id,
                        title: "New Assignment",
                        message:
                            `${assignment.title} was added to your group.`
                    });

                    return true;
                } catch (error) {
                    logError(
                        "NOTIFICATIONS",
                        `Assignment notification failed for ${recipientId}:`,
                        error
                    );
                    return false;
                }
            })
        );

        return {
            recipients: recipients.length,
            delivered: deliveries.filter(Boolean).length,
            failed: deliveries.filter((delivered) => !delivered).length
        };
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            "Assignment notification event failed:",
            error
        );

        return {
            recipients: 0,
            delivered: 0,
            failed: 0
        };
    }
}
