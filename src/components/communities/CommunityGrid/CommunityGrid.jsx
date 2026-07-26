import EmptyState from "../../EmptyState/EmptyState.jsx";
import CommunityCard from "../CommunityCard/index.js";
import styles from "./CommunityGrid.module.css";

export default function CommunityGrid({
    communities,
    createAction,
    getAction,
    onOpenCommunity
}) {
    if (!communities.length) {
        return (
            <EmptyState
                actionLabel={createAction?.label}
                description="Try another search or create a space for students to connect."
                illustration="communities"
                onAction={createAction?.onClick}
                title="No communities found"
            />
        );
    }

    return (
        <section
            aria-label="Community results"
            className={styles.grid}
            role="list"
        >
            {communities.map((community) => (
                <div key={community.id} role="listitem">
                    <CommunityCard
                        action={getAction?.(community)}
                        community={community}
                        onOpenCommunity={onOpenCommunity}
                    />
                </div>
            ))}
        </section>
    );
}
