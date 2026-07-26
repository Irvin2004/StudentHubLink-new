import Skeleton from "./Skeleton.jsx";
import styles from "./Skeleton.module.css";

export default function FileCardSkeleton({ count = 3 }) {
    return (
        <div
            aria-busy="true"
            aria-label="Loading files"
            className={styles.fileGrid}
            role="status"
        >
            <span className="sr-only">Loading files</span>
            {Array.from({ length: count }, (_, index) => (
                <article
                    aria-hidden="true"
                    className={styles.fileCard}
                    key={index}
                >
                    <Skeleton
                        borderRadius="0"
                        height="8.5rem"
                        variant="rectangle"
                    />
                    <div>
                        <Skeleton height="1rem" width="78%" />
                        <Skeleton height="0.7rem" width="48%" />
                        <Skeleton height="0.7rem" width="62%" />
                        <Skeleton height="0.7rem" width="38%" />
                    </div>
                    <Skeleton height="2.4rem" width="6rem" />
                </article>
            ))}
        </div>
    );
}
