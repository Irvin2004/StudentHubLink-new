import { REACTION_VALUES } from "../../../config/reaction-types.js";
import styles from "./MessageActions.module.css";

export default function MessageActions({
    canDelete,
    canEdit,
    onCopy,
    onDelete,
    onEdit,
    onReact,
    onReply
}) {
    return (
        <div
            aria-label="Message actions"
            className={`${styles.actions} message-actions`}
        >
            <button onClick={onReply} type="button">
                Reply
            </button>
            <details className={styles.reactionMenu}>
                <summary aria-label="React to message">React</summary>
                <div className={styles.reactionOptions}>
                    {REACTION_VALUES.map((reaction) => (
                        <button
                            aria-label={`React ${reaction}`}
                            key={reaction}
                            onClick={() => onReact(reaction)}
                            type="button"
                        >
                            {reaction}
                        </button>
                    ))}
                </div>
            </details>
            {canEdit ? (
                <button onClick={onEdit} type="button">
                    Edit
                </button>
            ) : null}
            <button onClick={onCopy} type="button">
                Copy
            </button>
            {canDelete ? (
                <button
                    className={styles.danger}
                    onClick={onDelete}
                    type="button"
                >
                    Delete
                </button>
            ) : null}
        </div>
    );
}
