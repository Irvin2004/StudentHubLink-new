const MENTION_PATTERN = /(^|\s)@([a-z0-9][a-z0-9._-]{1,31}|channel)\b/gi;

export function parseMentions(text) {
    const users = new Set();
    let channel = false;
    for (const match of String(text || "").matchAll(MENTION_PATTERN)) {
        const value = match[2].toLowerCase();
        if (value === "channel") channel = true;
        else users.add(value);
    }
    return { channel, users: [...users] };
}
