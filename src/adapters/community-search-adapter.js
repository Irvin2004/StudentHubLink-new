/**
 * Converts a community Firestore snapshot to the shared search result contract.
 *
 * @param {{id: string, data: () => object}} snapshot
 * @returns {Readonly<{id: string, type: string, title: string, subtitle: string, icon: string, url: string}>}
 */
export function toCommunitySearchResult(snapshot) {
    const data = snapshot.data();

    return Object.freeze({
        id: snapshot.id,
        type: "community",
        title: data.name || "Untitled community",
        subtitle: data.description || data.category || "Community",
        icon: "community",
        url: `/community/${snapshot.id}`
    });
}
