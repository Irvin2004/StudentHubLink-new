import Skeleton from "./Skeleton.jsx";
import styles from "./Skeleton.module.css";

export default function CommunityCardSkeleton({ count = 6 }) {
    return (
        <section
            aria-busy="true"
            aria-label="Loading communities"
            className={styles.communityGrid}
            role="status"
        >
            <span className="sr-only">Loading communities</span>
            {Array.from({ length: count }, (_, index) => (
                <article
                    aria-hidden="true"
                    className={styles.communityCard}
                    key={index}
                >
                    <Skeleton
                        borderRadius="0"
                        height="9rem"
                        variant="rectangle"
                    />
                    <div className={styles.communityBody}>
                        <div className={styles.communityMeta}>
                            <Skeleton
                                height="3.5rem"
                                variant="circle"
                                width="3.5rem"
                            />
                            <Skeleton height="1.5rem" width="4.5rem" />
                        </div>
                        <Skeleton height="1.25rem" width="68%" />
                        <Skeleton height="0.8rem" width="38%" />
                        <Skeleton count={2} height="0.8rem" />
                        <Skeleton height="2.5rem" width="5.5rem" />
                    </div>
                </article>
            ))}
        </section>
    );
}
