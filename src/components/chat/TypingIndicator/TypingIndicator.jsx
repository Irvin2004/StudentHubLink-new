import { formatTypingNames } from "../../../utils/message-formatter.js";
import styles from "./TypingIndicator.module.css";

export default function TypingIndicator({ users = [] }) {
    const message = formatTypingNames(users);

    return (
        <div aria-live="polite" className={styles.indicator} role="status">
            {message ? (
                <>
                    <span aria-hidden="true" className={styles.dots}>
                        <i />
                        <i />
                        <i />
                    </span>
                    {message}
                </>
            ) : (
                <span aria-hidden="true">&nbsp;</span>
            )}
        </div>
    );
}
