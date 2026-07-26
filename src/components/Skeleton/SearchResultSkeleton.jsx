import Skeleton from "./Skeleton.jsx";
import styles from "./Skeleton.module.css";

export default function SearchResultSkeleton({
    count = 4,
    label = "Searching StudentHub"
}) {
    return (
        <div aria-busy="true" className={styles.resultList} role="status">
            <span className="sr-only">{label}</span>
            {Array.from({ length: count }, (_, index) => (
                <div
                    aria-hidden="true"
                    className={styles.resultRow}
                    key={index}
                >
                    <Skeleton height="2rem" variant="rectangle" width="2rem" />
                    <div>
                        <Skeleton
                            height="0.9rem"
                            width={index % 2 ? "58%" : "72%"}
                        />
                        <Skeleton
                            height="0.7rem"
                            width={index % 2 ? "42%" : "55%"}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
