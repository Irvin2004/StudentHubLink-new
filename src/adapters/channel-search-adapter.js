/**
 * Converts a channel Firestore snapshot to the shared search result contract.
 *
 * @param {{id: string, data: () => object, ref?: object}} snapshot
 * @returns {Readonly<{id: string, type: string, title: string, subtitle: string, icon: string, url: string}>}
 */
export function toChannelSearchResult(snapshot) {
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
