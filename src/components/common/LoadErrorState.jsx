import EmptyState from "../EmptyState/EmptyState.jsx";

export function LoadErrorState({
    description = "We could not load this content. Please try again.",
    onRetry,
    title = "Content unavailable"
}) {
    return (
        <div role="alert">
            <EmptyState
                actionLabel={onRetry ? "Try again" : undefined}
                actionVariant="outline"
                description={description}
                icon="!"
                onAction={onRetry}
                title={title}
            />
        </div>
    );
}
