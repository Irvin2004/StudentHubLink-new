export const QUESTION_STATUS = Object.freeze({
    UNANSWERED: "unanswered",
    ANSWERED: "answered",
    SOLVED: "solved"
});

export const QUESTION_STATUS_VALUES = Object.freeze(
    Object.values(QUESTION_STATUS)
);

function requiredText(value, label, maxLength) {
    const text = String(value || "").trim();
    if (!text) throw new TypeError(`${label} is required.`);
    if (text.length > maxLength) {
        throw new TypeError(
            `${label} must not exceed ${maxLength} characters.`
        );
    }
    return text;
}

export function normalizeQuestionTags(tags = []) {
    const normalized = [
        ...new Set(
            tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
        )
    ];
    if (!normalized.length) {
        throw new TypeError("Add at least one subject or topic tag.");
    }
    if (normalized.length > 5)
        throw new TypeError("Add no more than 5 topic tags.");
    if (normalized.some((tag) => tag.length > 30)) {
        throw new TypeError("Each topic tag must not exceed 30 characters.");
    }
    return normalized;
}

export function validateQuestionInput(input = {}) {
    const linkedResource = input.linkedResource
        ? {
              id: requiredText(input.linkedResource.id, "Resource ID", 240),
              title: requiredText(
                  input.linkedResource.title,
                  "Resource title",
                  160
              )
          }
        : null;

    return {
        title: requiredText(input.title, "Question title", 160),
        description: requiredText(
            input.description,
            "Question description",
            5000
        ),
        tags: normalizeQuestionTags(input.tags),
        linkedResource
    };
}

export function validateAnswerContent(content) {
    return requiredText(content, "Answer", 5000);
}

export function validateCommentContent(content) {
    return requiredText(content, "Comment", 1000);
}

export function questionFromSnapshot(snapshot) {
    const data = snapshot.data();
    return Object.freeze({ id: snapshot.id, ...data });
}

export function answerFromSnapshot(snapshot) {
    const data = snapshot.data();
    return Object.freeze({ id: snapshot.id, ...data });
}

export function commentFromSnapshot(snapshot) {
    const data = snapshot.data();
    return Object.freeze({ id: snapshot.id, ...data });
}
