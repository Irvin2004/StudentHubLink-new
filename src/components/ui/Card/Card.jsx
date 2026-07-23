import { forwardRef } from "react";

import { cx } from "../utils.js";
import styles from "./Card.module.css";

/**
 * Renders a generic surface container.
 */
const Card = forwardRef(function Card(
    {
        as: Component = "section",
        children,
        className,
        padding = "medium",
        ...props
    },
    ref
) {
    return (
        <Component
            {...props}
            className={cx(styles.card, styles[padding], className)}
            ref={ref}
        >
            {children}
        </Component>
    );
});

export default Card;
