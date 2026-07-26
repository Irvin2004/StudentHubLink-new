import { getTimestampMillis } from "./format-date.js";

export function formatTimeAgo(value, now = Date.now()) {
    const timestamp = getTimestampMillis(value);
    const currentTimestamp = getTimestampMillis(now);

    if (!timestamp || !currentTimestamp) {
        return "Recently";
    }

    const elapsedSeconds = Math.max(
        0,
        Math.floor((currentTimestamp - timestamp) / 1000)
    );

    if (elapsedSeconds < 60) {
        return "Just now";
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 60) {
        return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
        return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
    }

    if (elapsedHours < 48) {
        return "Yesterday";
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}
