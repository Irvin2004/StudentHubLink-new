import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import { TaskCard } from "../TaskCard/index.js";
import styles from "./TaskList.module.css";

export function TaskList({
    emphasis = false,
    highlightedTaskId,
    loading,
    onDeleteTask,
    onEditTask,
    onStartSession,
    onStudyFlashcards,
    onTakeQuiz,
    onToggleTask,
    tasks = [],
    taskCount = tasks.length,
    title
}) {
    if (loading) {
        return (
            <section className={styles.section} aria-busy="true">
                <Skeleton width="8rem" />
                <div className={styles.divider} />
                <Skeleton height="3.5rem" />
                <Skeleton height="3.5rem" />
            </section>
        );
    }

    if (!tasks.length) return null;

    return (
        <section
            className={`${styles.section} ${emphasis ? styles.emphasis : ""}`}
        >
            <header className={styles.header}>
                <h2>
                    {title} <span className={styles.count}>({taskCount})</span>
                </h2>
                <span className={styles.divider} />
            </header>
            <div className={styles.list}>
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        highlighted={task.id === highlightedTaskId}
                        onDelete={onDeleteTask}
                        onEdit={onEditTask}
                        onStartSession={onStartSession}
                        onStudyFlashcards={onStudyFlashcards}
                        onTakeQuiz={onTakeQuiz}
                        onToggle={onToggleTask}
                        task={task}
                    />
                ))}
            </div>
        </section>
    );
}

export default TaskList;
