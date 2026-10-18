export function getActiveStudyResources(context) {
    if (!context) return [];
    return context.resources || [context];
}
