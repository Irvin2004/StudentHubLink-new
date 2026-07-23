/**
 * Normalizes an email address before it crosses a service boundary.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeEmail(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}
