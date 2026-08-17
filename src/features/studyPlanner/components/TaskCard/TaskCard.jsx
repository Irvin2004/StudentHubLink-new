import styles from "./TaskCard.module.css";

export function TaskCard({
    highlighted = false,
    onDelete,
    onEdit,
    onStartSession,
    onStudyFlashcards,
    onTakeQuiz,
    onToggle,
    task
}) {
    return (
        <article
            aria-current={highlighted ? "true" : undefined}
            className={`${styles.card} ${
                task.completed ? styles.completedCard : ""
            } ${highlighted ? styles.highlightedCard : ""}`}
            id={`study-task-${encodeURIComponent(task.id)}`}
            tabIndex={highlighted ? -1 : undefined}
        >
            <label className={styles.checkboxLabel}>
                <input
                    aria-label={`Mark ${task.title} ${
                        task.completed ? "incomplete" : "complete"
                    }`}
                    checked={task.completed}
                    className={styles.checkbox}
                    onChange={() => onToggle?.(task.id)}
                    type="checkbox"
                />
                <span className={styles.content}>
                    <span
                        className={`${styles.title} ${
                            task.completed ? styles.completedTitle : ""
                        }`}
                    >
                        {task.title}
                    </span>
                    <span className={styles.meta}>
                        {task.subject} <span aria-hidden="true">·</span>{" "}
                        {task.estimatedTime} <span aria-hidden="true">·</span>{" "}
                        {task.priority}
                    </span>
                    {task.notes ? (
                        <span className={styles.notes}>{task.notes}</span>
                    ) : null}
                    <span
                        className={`${styles.dueStatus} ${
                            task.dueGroup === "overdue"
                                ? styles.overdueStatus
                                : ""
                        }`}
                    >
                        {task.dueStatus}
                    </span>
                </span>
            </label>
            <div className={styles.actions}>
                {!task.completed ? (
                    <>
                        {task.flashcardDeckId ? (
                            <button
                                aria-label={`Study flashcards for ${task.title}`}
                                className={styles.flashcardButton}
                                onClick={() => onStudyFlashcards?.(task)}
                                type="button"
                            >
                                Study Flashcards
                            </button>
                        ) : null}
                        {task.taskType === "quiz" && task.quizId ? (
                            <button
                                aria-label={`Take quiz for ${task.title}`}
                                className={styles.flashcardButton}
                                onClick={() => onTakeQuiz?.(task)}
                                type="button"
                            >
                                Take Quiz
                            </button>
                        ) : null}
                        <button
                            aria-label={`Start study session for ${task.title}`}
                            className={styles.sessionButton}
                            onClick={() => onStartSession?.(task)}
                            type="button"
                        >
                            Start Session
                        </button>
                    </>
                ) : null}
                <button
                    aria-label={`Edit ${task.title}`}
                    className={styles.editButton}
                    onClick={() => onEdit?.(task)}
                    type="button"
                >
                    Edit
                </button>
                <button
                    aria-label={`Delete ${task.title}`}
                    className={styles.deleteButton}
                    onClick={() => onDelete?.(task)}
                    type="button"
                >
                    Delete
                </button>
            </div>
        </article>
    );
}

export default TaskCard;
