import {
    createStudyContext,
    loadResourceContext,
    MAX_STUDY_RESOURCES
} from "../../aiAssistant/services/resource-context.js";
import { formatCollectionItemContext } from "../models/knowledge-collection.js";

async function itemContext(item) {
    if (item.sourceType === "resource") {
        return loadResourceContext({
            content: item.content,
            extension: item.extension,
            id: item.sourceId,
            originalName: item.originalName,
            resourceKey: item.sourceId,
            title: item.title,
            url: item.url
        });
    }
    return {
        content: formatCollectionItemContext(item),
        contextKind: item.sourceType,
        id: `${item.sourceType}:${item.sourceId}`,
        subject: item.title,
        title: item.title
    };
}

function groupContexts(contexts, collectionId) {
    if (contexts.length <= MAX_STUDY_RESOURCES) return contexts;
    const groups = Array.from({ length: MAX_STUDY_RESOURCES }, () => []);
    contexts.forEach((context, index) => {
        groups[
            Math.floor((index * MAX_STUDY_RESOURCES) / contexts.length)
        ].push(context);
    });
    return groups.filter(Boolean).map((group, index) => ({
        content: group
            .map(
                (context, itemIndex) =>
                    `Collection item ${itemIndex + 1}: ${context.title}\n${context.content}`
            )
            .join("\n\n"),
        contextKind: "collection-group",
        id: `collection:${collectionId}:group:${index}:${group
            .map((context) => context.id)
            .join("+")}`,
        subject: group.map((context) => context.title).join(" + "),
        title: `${group[0].title}${group.length > 1 ? ` + ${group.length - 1} more` : ""}`
    }));
}

export async function createCollectionStudyContext(
    communityId,
    knowledgeCollection
) {
    if (!knowledgeCollection?.items?.length) {
        throw new TypeError(
            "This collection does not have study materials yet."
        );
    }
    const contexts = await Promise.all(
        knowledgeCollection.items.map(itemContext)
    );
    const grouped = groupContexts(contexts, knowledgeCollection.id);
    const studyContext = createStudyContext(grouped);
    return {
        ...studyContext,
        id: `collection:${communityId}:${knowledgeCollection.id}:${studyContext.id}`,
        subject: knowledgeCollection.title,
        title: knowledgeCollection.title
    };
}
