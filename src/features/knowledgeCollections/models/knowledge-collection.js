export const KNOWLEDGE_ITEM_TYPES = Object.freeze({
    ANSWER: "answer",
    FLASHCARD_SET: "flashcard_set",
    QUESTION: "question",
    QUIZ: "quiz",
    RESOURCE: "resource"
});

export const KNOWLEDGE_ITEM_TYPE_LABELS = Object.freeze({
    [KNOWLEDGE_ITEM_TYPES.ANSWER]: "Useful answer",
    [KNOWLEDGE_ITEM_TYPES.FLASHCARD_SET]: "Flashcard set",
    [KNOWLEDGE_ITEM_TYPES.QUESTION]: "Solved question",
    [KNOWLEDGE_ITEM_TYPES.QUIZ]: "Quiz",
    [KNOWLEDGE_ITEM_TYPES.RESOURCE]: "Resource"
});

export const MAX_COLLECTION_ITEMS = 20;
export const MAX_ITEM_CONTEXT_LENGTH = 5_000;

function text(value, maximum = Number.POSITIVE_INFINITY) {
    return String(value || "")
        .trim()
        .slice(0, maximum);
}

export function normalizeKnowledgeTags(tags = []) {
    const normalized = [
        ...new Set(
            tags.map((tag) => text(tag, 30).toLowerCase()).filter(Boolean)
        )
    ];
    if (!normalized.length) throw new TypeError("Add at least one topic tag.");
    if (normalized.length > 5) throw new TypeError("Add no more than 5 tags.");
    return normalized;
}

export function normalizeKnowledgeItem(input = {}, actor = {}) {
    const sourceType = text(input.sourceType);
    if (!Object.values(KNOWLEDGE_ITEM_TYPES).includes(sourceType)) {
        throw new TypeError("Choose a supported collection item.");
    }
    const sourceId = text(input.sourceId, 300);
    const title = text(input.title, 160);
    if (!sourceId || !title) {
        throw new TypeError("Collection items need a source and title.");
    }
    return Object.freeze({
        id: text(input.id, 400) || `${sourceType}:${sourceId}`,
        sourceId,
        sourceType,
        title,
        content: text(input.content, MAX_ITEM_CONTEXT_LENGTH),
        url: text(input.url, 2_000),
        extension: text(input.extension, 20).toLowerCase(),
        originalName: text(input.originalName, 255),
        addedBy: text(input.addedBy || actor.id, 128),
        addedByName: text(
            input.addedByName || actor.displayName || "Student",
            120
        )
    });
}

export function validateKnowledgeCollection(input = {}, actor = {}) {
    const title = text(input.title, 120);
    const description = text(input.description, 2_000);
    if (!title) throw new TypeError("A collection title is required.");
    if (!description)
        throw new TypeError("A collection description is required.");
    const items = (input.items || []).map((item) =>
        normalizeKnowledgeItem(item, actor)
    );
    if (!items.length) throw new TypeError("Add at least one study item.");
    if (items.length > MAX_COLLECTION_ITEMS) {
        throw new TypeError(`Add no more than ${MAX_COLLECTION_ITEMS} items.`);
    }
    if (new Set(items.map((item) => item.id)).size !== items.length) {
        throw new TypeError("Each collection item can only be added once.");
    }
    return {
        description,
        items,
        tags: normalizeKnowledgeTags(input.tags || []),
        title
    };
}

export function collectionFromSnapshot(snapshot) {
    const data = snapshot.data();
    return Object.freeze({
        id: snapshot.id,
        ...data,
        contributors: Array.isArray(data.contributors) ? data.contributors : [],
        items: Array.isArray(data.items) ? data.items : [],
        tags: Array.isArray(data.tags) ? data.tags : []
    });
}

export function formatCollectionItemContext(item) {
    const type = KNOWLEDGE_ITEM_TYPE_LABELS[item.sourceType] || "Study item";
    return [`${type}: ${item.title}`, item.content]
        .filter(Boolean)
        .join("\n\n");
}
