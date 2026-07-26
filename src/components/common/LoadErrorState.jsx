import EmptyState from "../ui/EmptyState/index.js";

export function LoadErrorState({
    description = "We could not load this content. Please try again.",
    onRetry,
    title = "Content unavailable"
}) {
    return (
        <div role="alert">
            <EmptyState
                action={
                    onRetry
                        ? {
                              label: "Try again",
                              onClick: onRetry,
                              variant: "outline"
                          }
                        : undefined
                }
                description={description}
                icon="!"
                title={title}
            />
        </div>
    );
}
