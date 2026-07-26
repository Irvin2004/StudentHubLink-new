import styles from "./PinnedMessages.module.css";

export default function PinnedMessages({ messages = [] }) {
    if (!messages.length) return null;

    return (
        <aside aria-label="Pinned messages" className={styles.panel}>
            <strong>📌 Pinned messages</strong>
            <div className={styles.items}>
                {messages.map((message) => (
                    <button
                        key={message.id}
                        onClick={() => {
                            const target = document.getElementById(
                                `message-${message.id}`
                            );
                            target?.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });
                            target?.focus({ preventScroll: true });
                        }}
                        type="button"
                    >
                        <span>{message.senderName}</span>
                        {message.text || "Shared an attachment"}
                    </button>
                ))}
            </div>
        </aside>
    );
}
