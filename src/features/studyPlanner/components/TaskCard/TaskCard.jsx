import styles from "./TaskCard.module.css";

export function TaskCard({ task }) {
    return (
        <article className={styles.card}>
            <label className={styles.checkboxLabel}>
                <input
                    checked={task.completed}
                    className={styles.checkbox}
                    readOnly
                    type="checkbox"
                />
                <span className={styles.content}>
                    <span className={styles.title}>{task.title}</span>
                    <span className={styles.meta}>
                        {task.subject} · {task.estimatedTime} · {task.priority}
                    </span>
                </span>
            </label>
        </article>
    );
}

export default TaskCard;
