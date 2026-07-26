import Skeleton from "./Skeleton.jsx";
import styles from "./Skeleton.module.css";

export default function ChatMessageSkeleton({ count = 4 }) {
    return (
        <div
            aria-busy="true"
            aria-label="Loading messages"
            className={styles.messageList}
            role="status"
        >
            <span className="sr-only">Loading messages</span>
            {Array.from({ length: count }, (_, index) => (
                <div
                    aria-hidden="true"
                    className={styles.messageRow}
                    key={index}
                >
                    <Skeleton height="2.5rem" variant="circle" width="2.5rem" />
                    <div>
                        <Skeleton
                            height="0.8rem"
                            width={index % 2 ? "8rem" : "10rem"}
                        />
                        <Skeleton
                            height="0.8rem"
                            width={index % 2 ? "64%" : "82%"}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
