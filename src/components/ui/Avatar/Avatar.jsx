import { useState } from "react";

import { cx, getInitials } from "../utils.js";
import styles from "./Avatar.module.css";

/**
 * Displays a profile image with initials fallback and optional presence status.
 */
export default function Avatar({
    alt,
    className,
    name = "",
    size = "medium",
    src,
    status
}) {
    const [failed, setFailed] = useState(false);
    const showImage = src && !failed;
    const accessibleName = alt || name || "Avatar";

    return (
        <span
            aria-label={
                status ? `${accessibleName}, ${status}` : accessibleName
            }
            className={cx(styles.avatar, styles[size], className)}
            role="img"
        >
            {showImage ? (
                <img
                    alt=""
                    className={styles.image}
                    onError={() => setFailed(true)}
                    src={src}
                />
            ) : (
                <span aria-hidden="true" className={styles.fallback}>
                    {getInitials(name) || "?"}
                </span>
            )}
            {status ? (
                <span
                    aria-hidden="true"
                    className={cx(styles.status, styles[status])}
                />
            ) : null}
        </span>
    );
}
