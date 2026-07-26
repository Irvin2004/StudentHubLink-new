import Button from "../Button/index.js";
import { useId } from "react";
import styles from "./EmptyState.module.css";

/**
 * Explains an empty result and optionally presents a recovery action.
 */
export default function EmptyState({ action, description, icon, title }) {
    const titleId = useId();

    return (
        <section className={styles.emptyState} aria-labelledby={titleId}>
            {icon ? (
                <div aria-hidden="true" className={styles.icon}>
                    {icon}
                </div>
            ) : null}
            <h2 id={titleId}>{title}</h2>
            <p>{description}</p>
            {action ? (
                <Button
                    aria-label={action.ariaLabel || action.label}
                    onClick={action.onClick}
                    variant={action.variant || "primary"}
                >
                    {action.label}
                </Button>
            ) : null}
        </section>
    );
}
