import { REACTION_EMOJIS } from "../../../config/reaction-types.js";
import styles from "./MessageReactions.module.css";

export default function MessageReactions({ currentUserId, message, onToggle }) {
    const entries = Object.entries(message.reactions || {}).filter(
        ([key, users]) => REACTION_EMOJIS[key] && users.length
    );

    if (!entries.length) return null;

    return (
        <div aria-label="Message reactions" className={styles.reactions}>
            {entries.map(([key, users]) => {
                const selected = users.includes(currentUserId);
                return (
                    <button
                        aria-label={`${REACTION_EMOJIS[key]} reaction, ${users.length}`}
                        aria-pressed={selected}
                        className={styles.reaction}
                        key={key}
                        onClick={() => onToggle(REACTION_EMOJIS[key])}
                        type="button"
                    >
                        <span aria-hidden="true">{REACTION_EMOJIS[key]}</span>
                        <span>{users.length}</span>
                    </button>
                );
            })}
        </div>
    );
}
