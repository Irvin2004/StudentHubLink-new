import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import { TaskCard } from "../TaskCard/index.js";
import styles from "./TaskList.module.css";

export function TaskList({ loading, tasks = [], title }) {
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

    if (!tasks.length) {
        return (
            <section className={styles.section}>
                <header className={styles.header}>
                    <h2>{title}</h2>
                    <span className={styles.divider} />
                </header>
                <EmptyState
                    description="No study tasks scheduled for this view."
                    icon="📅"
                    title="Nothing planned"
                />
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <h2>{title}</h2>
                <span className={styles.divider} />
            </header>
            <div className={styles.list}>
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </div>
        </section>
    );
}

export default TaskList;
