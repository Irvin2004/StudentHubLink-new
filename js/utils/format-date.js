export function toDate(value) {
    if (!value) {
        return null;
    }

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function getTimestampMillis(value) {
    if (!value) {
        return 0;
    }

    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }

    const date = toDate(value);

    return date ? date.getTime() : 0;
}

export function formatDate(
    value,
    { fallback = "Unknown", locale, options } = {}
) {
    const date = toDate(value);

    if (!date) {
        return fallback;
    }

    return date.toLocaleDateString(locale, options);
}

export function formatLongDate(value) {
    return formatDate(value, {
        fallback: "Not available",
        locale: "en-ZA",
        options: {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    });
}

export function formatTime(
    value,
    {
        fallback = "",
        locale,
        options = {
            hour: "2-digit",
            minute: "2-digit"
        }
    } = {}
) {
    const date = toDate(value);

    if (!date) return fallback;

    return date.toLocaleTimeString(locale, options);
}
