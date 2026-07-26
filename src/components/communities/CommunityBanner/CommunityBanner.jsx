import styles from "./CommunityBanner.module.css";

export default function CommunityBanner({ alt = "", category, src }) {
    return (
        <div className={styles.banner}>
            {src ? (
                <img alt={alt} src={src} />
            ) : (
                <div
                    aria-label={`${category || "Community"} banner`}
                    className={styles.fallback}
                    role="img"
                >
                    <span aria-hidden="true">
                        {String(category || "C")
                            .charAt(0)
                            .toUpperCase()}
                    </span>
                </div>
            )}
        </div>
    );
}
