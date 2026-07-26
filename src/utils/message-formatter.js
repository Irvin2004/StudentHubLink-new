function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === "function") return value.toDate();

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMessageTime(value, locale) {
    const date = toDate(value);
    if (!date) return "Sending…";

    return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

export function getMessageDateKey(value) {
    const date = toDate(value);
    if (!date) return "pending";

    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatMessageDate(value, locale) {
    const date = toDate(value);
    if (!date) return "Today";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (getMessageDateKey(date) === getMessageDateKey(today)) return "Today";
    if (getMessageDateKey(date) === getMessageDateKey(yesterday)) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric"
    }).format(date);
}

export function groupMessagesByDate(messages = []) {
    return messages.reduce((groups, message) => {
        const key = getMessageDateKey(message.createdAt);
        const current = groups.at(-1);

        if (current?.key === key) {
            current.messages.push(message);
            return groups;
        }

        groups.push({
            key,
            label: formatMessageDate(message.createdAt),
            messages: [message]
        });
        return groups;
    }, []);
}

export function formatTypingNames(typingUsers = []) {
    const names = typingUsers.map((user) => user.displayName);

    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;

    return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing…`;
}
