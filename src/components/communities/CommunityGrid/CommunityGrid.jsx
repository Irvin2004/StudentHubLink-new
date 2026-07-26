import EmptyState from "../../ui/EmptyState/index.js";
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
                action={createAction}
                description="Try another search or create a space for students to connect."
                icon="👥"
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
