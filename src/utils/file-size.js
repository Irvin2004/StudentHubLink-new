const UNITS = ["B", "KB", "MB", "GB"];

export function formatFileSize(bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size < 0) return "Unknown size";
    if (size === 0) return "0 B";

    const unitIndex = Math.min(
        Math.floor(Math.log(size) / Math.log(1024)),
        UNITS.length - 1
    );
    const value = size / 1024 ** unitIndex;
    const digits = value >= 10 || unitIndex === 0 ? 0 : 1;

    return `${value.toFixed(digits)} ${UNITS[unitIndex]}`;
}
