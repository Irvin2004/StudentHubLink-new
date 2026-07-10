export function showSkeleton(containerId, count = 6) {
    const container =
    document.getElementById(containerId);

    if (!container) return;

    container.innerHTML =
    Array.from({ length: count })
        .map(() => `
            <div class="skeleton-card">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line large"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
            </div>
        `)
        .join("");
}

export function clearSkeleton(containerId) {
    const container =
    document.getElementById(containerId);

    if (container) {
        container.innerHTML = "";
    }
}
