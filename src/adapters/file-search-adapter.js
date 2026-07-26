/**
 * Converts a file Firestore snapshot to the shared search result contract.
 *
 * @param {{id: string, data: () => object, ref?: object}} snapshot
 * @returns {Readonly<{id: string, type: string, title: string, subtitle: string, icon: string, url: string}>}
 */
export function toFileSearchResult(snapshot) {
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
