import { cloneElement, useId, useState } from "react";

import { cx } from "../utils.js";
import styles from "./Tooltip.module.css";

/**
 * Adds hover and keyboard-focus help to a single interactive child.
 */
export default function Tooltip({ children, content, placement = "top" }) {
    const id = useId();
    const [visible, setVisible] = useState(false);

    return (
        <span
            className={styles.wrapper}
            onBlur={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {cloneElement(children, {
                "aria-describedby": visible ? id : undefined
            })}
            {visible ? (
                <span
                    className={cx(
                        styles.tooltip,
                        styles[placement],
                        styles.visible
                    )}
                    id={id}
                    role="tooltip"
                >
                    {content}
                </span>
            ) : null}
        </span>
    );
}
