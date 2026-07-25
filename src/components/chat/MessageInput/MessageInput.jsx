import { forwardRef } from "react";

import styles from "./MessageInput.module.css";

const MessageInput = forwardRef(function MessageInput(
    { onSend, ...props },
    ref
) {
    function handleKeyDown(event) {
        props.onKeyDown?.(event);

        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent?.isComposing
        ) {
            event.preventDefault();
            onSend();
        }
    }

    return (
        <textarea
            {...props}
            aria-label={props["aria-label"] || "Message"}
            className={styles.input}
            onKeyDown={handleKeyDown}
            ref={ref}
            rows={1}
        />
    );
});

export default MessageInput;
