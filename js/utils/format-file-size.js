export function formatFileSize(bytes, decimals = 1) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(
        Math.floor(Math.log(size) / Math.log(1024)),
        units.length - 1
    );
    const value = size / 1024 ** unitIndex;

    return `${value.toFixed(unitIndex === 0 ? 0 : decimals)} ${units[unitIndex]}`;
}
