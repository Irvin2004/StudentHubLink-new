import { useId } from "react";

import Button from "../ui/Button/Button.jsx";
import communitiesIllustration from "./illustrations/communities.svg";
import filesIllustration from "./illustrations/files.svg";
import notificationsIllustration from "./illustrations/notifications.svg";
import searchIllustration from "./illustrations/search.svg";
import styles from "./EmptyState.module.css";

const ILLUSTRATIONS = Object.freeze({
    communities: communitiesIllustration,
    files: filesIllustration,
    notifications: notificationsIllustration,
    search: searchIllustration
});

export default function EmptyState({
    actionAriaLabel,
    actionLabel,
    actionVariant = "primary",
    className = "",
    description,
    icon,
    illustration,
    onAction,
    title
}) {
    const titleId = useId();
    const illustrationSource = ILLUSTRATIONS[illustration];
    const classNames = [styles.emptyState, className].filter(Boolean).join(" ");
    const hasAction = Boolean(actionLabel && onAction);

    return (
        <section aria-labelledby={titleId} className={classNames}>
            {illustrationSource ? (
                <img
                    alt=""
                    aria-hidden="true"
                    className={styles.illustration}
                    src={illustrationSource}
                />
            ) : icon ? (
                <div aria-hidden="true" className={styles.icon}>
                    {icon}
                </div>
            ) : null}
            <div className={styles.copy}>
                <h2 id={titleId}>{title}</h2>
                <p>{description}</p>
            </div>
            {hasAction ? (
                <Button
                    aria-label={actionAriaLabel || actionLabel}
                    onClick={onAction}
                    variant={actionVariant}
                >
                    {actionLabel}
                </Button>
            ) : null}
        </section>
    );
}
