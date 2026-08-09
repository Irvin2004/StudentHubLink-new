import { useMemo, useState } from "react";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import Button from "../../components/ui/Button/index.js";
import Card from "../../components/ui/Card/Card.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { AddTaskModal } from "./components/AddTaskModal/index.js";
import { TaskList } from "./components/TaskList/index.js";
import { WeeklyProgress } from "./components/WeeklyProgress/index.js";
import { useStudyPlanner } from "./hooks/useStudyPlanner.js";
import styles from "./StudyPlanner.module.css";

function AddIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
            />
        </svg>
    );
}

export default function StudyPlannerPage() {
    useDocumentTitle("StudentHub - Study Planner", "react-app");

    const { addTask, error, loading, progress, tasks } = useStudyPlanner();
    const [addTaskOpen, setAddTaskOpen] = useState(false);

    const todayTasks = useMemo(
        () => tasks.filter((task) => task.dueGroup === "today"),
        [tasks]
    );
    const tomorrowTasks = useMemo(
        () => tasks.filter((task) => task.dueGroup === "tomorrow"),
        [tasks]
    );

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>📅 Study Planner</h1>
                    <p>Plan your study tasks and track weekly progress.</p>
                </div>
                <Button icon={<AddIcon />} onClick={() => setAddTaskOpen(true)}>
                    Add Study Task
                </Button>
            </header>

            <Card className={styles.plannerCard}>
                {error ? (
                    <LoadErrorState title="Study planner unavailable" />
                ) : (
                    <>
                        <TaskList
                            loading={loading}
                            tasks={todayTasks}
                            title="Today"
                        />
                        <TaskList
                            loading={loading}
                            tasks={tomorrowTasks}
                            title="Tomorrow"
                        />
                        <WeeklyProgress progress={loading ? 0 : progress} />
                    </>
                )}
            </Card>

            <AddTaskModal
                onAddTask={addTask}
                onClose={() => setAddTaskOpen(false)}
                open={addTaskOpen}
            />
        </main>
    );
}
