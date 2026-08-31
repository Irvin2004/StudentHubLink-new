const MAX_CONTEXT_LENGTH = 12_000;
export const MAX_STUDY_RESOURCES = 5;
const TEXT_EXTENSIONS = new Set(["csv", "json", "md", "text", "txt"]);
const INLINE_CONTENT_FIELDS = [
    "content",
    "extractedText",
    "text",
    "notes",
    "body",
    "description"
];

function clean(value) {
    return String(value || "").trim();
}

function getInlineContent(resource) {
    return INLINE_CONTENT_FIELDS.map((field) => clean(resource?.[field])).find(
        Boolean
    );
}

function getResourceDetails(resource) {
    const details = [
        `Resource title: ${clean(resource?.title || resource?.originalName)}`,
        resource?.originalName
            ? `File name: ${clean(resource.originalName)}`
            : "",
        resource?.communityName
            ? `Community: ${clean(resource.communityName)}`
            : "",
        resource?.channelName ? `Channel: ${clean(resource.channelName)}` : "",
        resource?.extension
            ? `File type: ${clean(resource.extension).toUpperCase()}`
            : ""
    ];

    return details.filter(Boolean).join("\n");
}

async function getTextFileContent(resource, fetcher) {
    const extension = clean(resource?.extension).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension) || !resource?.url) return "";

    const response = await fetcher(resource.url);
    if (!response.ok) {
        throw new Error(
            `Resource text could not be loaded (${response.status}).`
        );
    }
    return clean(await response.text());
}

export async function loadResourceContext(resource, fetcher = fetch) {
    if (!resource)
        throw new TypeError("Choose a resource to study with Thuto.");

    const id = clean(resource.resourceKey || resource.id);
    const title = clean(resource.title || resource.originalName) || "Resource";
    const details = getResourceDetails(resource);
    let body = getInlineContent(resource);
    let contextKind = body ? "content" : "metadata";

    if (!body) {
        try {
            body = await getTextFileContent(resource, fetcher);
            if (body) contextKind = "text-file";
        } catch {
            body = "";
        }
    }

    const content = [details, body].filter(Boolean).join("\n\n");

    return {
        content: content.slice(0, MAX_CONTEXT_LENGTH),
        contextKind,
        id,
        originalName: clean(resource.originalName),
        subject: title,
        title
    };
}

function uniqueContexts(contexts) {
    return contexts.filter(
        (context, index, items) =>
            context?.id &&
            items.findIndex((candidate) => candidate?.id === context.id) ===
                index
    );
}

function getResourceSetId(contexts) {
    if (contexts.length === 1) return contexts[0].id;
    return `set:${contexts
        .map((context) => context.id)
        .sort((first, second) => first.localeCompare(second))
        .map(encodeURIComponent)
        .join("+")}`;
}

function composeContent(contexts) {
    if (contexts.length === 1) return contexts[0].content;

    const headings = contexts.map(
        (context, index) => `Study material ${index + 1}: ${context.title}`
    );
    const fixedLength =
        headings.join("\n\n").length + (contexts.length - 1) * 2;
    const contentLength = Math.max(
        1,
        Math.floor((MAX_CONTEXT_LENGTH - fixedLength) / contexts.length)
    );

    return contexts
        .map(
            (context, index) =>
                `${headings[index]}\n${context.content.slice(0, contentLength)}`
        )
        .join("\n\n")
        .slice(0, MAX_CONTEXT_LENGTH);
}

export function createStudyContext(resourceContexts) {
    const resources = uniqueContexts(resourceContexts || []);
    if (!resources.length) {
        throw new TypeError("Choose at least one study material for Thuto.");
    }
    if (resources.length > MAX_STUDY_RESOURCES) {
        throw new TypeError(
            `Choose up to ${MAX_STUDY_RESOURCES} study materials for now.`
        );
    }

    if (resources.length === 1) {
        return { ...resources[0], resources };
    }

    const title = `${resources.length} study materials`;
    const subject = resources.map((resource) => resource.title).join(" + ");
    return {
        content: composeContent(resources),
        contextKind: "multi-resource",
        id: getResourceSetId(resources),
        resources,
        subject,
        title
    };
}
