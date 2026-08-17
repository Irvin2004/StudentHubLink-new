import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import Button from "../../components/ui/Button/index.js";
import Card from "../../components/ui/Card/Card.jsx";
import Input from "../../components/ui/Input/index.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { StudyAnalytics } from "../studySessions/components/StudyAnalytics/StudyAnalytics.jsx";
import { StudyHistory } from "../studySessions/components/StudyHistory/StudyHistory.jsx";
import { useStudySession } from "../studySessions/context/study-session-context.js";
import { useStudySessions } from "../studySessions/hooks/useStudySessions.js";
import { AddTaskModal } from "./components/AddTaskModal/index.js";
import { ClearCompletedModal } from "./components/ClearCompletedModal/index.js";
import { DeleteTaskModal } from "./components/DeleteTaskModal/index.js";
import { TaskList } from "./components/TaskList/index.js";
import { WeeklyProgress } from "./components/WeeklyProgress/index.js";
import { useStudyPlanner } from "./hooks/useStudyPlanner.js";
import {
    getDateKey,
    sortTasksByDueDate,
    TASK_GROUPS
} from "./utils/task-grouping.js";
import { ROUTES } from "../../config/routes.js";
import styles from "./StudyPlanner.module.css";

const TASK_FILTERS = Object.freeze([
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" }
]);

const PRIORITY_FILTERS = Object.freeze([
    { id: "all", label: "All" },
    { id: "High", label: "High" },
    { id: "Medium", label: "Medium" },
    { id: "Low", label: "Low" }
]);

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
    const { startSession } = useStudySession();
    const sessionHistory = useStudySessions();

    const {
        addTask,
        activeStudyMinutes,
        clearCompleted,
        completedTasks,
        deleteTask,
        editTask,
        error,
        flashcardDecks,
        loading,
        mutationError,
        quizzes,
        tasks,
        todayStudyMinutes,
        totalTasks,
        toggleTask
    } = useStudyPlanner();
    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskFilter, setTaskFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [clearCompletedOpen, setClearCompletedOpen] = useState(false);
    const [deletingTask, setDeletingTask] = useState(null);
    const [newTaskDefaults, setNewTaskDefaults] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const linkedTaskId = searchParams.get("task");
    const handledTaskIdRef = useRef(null);

    useEffect(() => {
        if (!linkedTaskId || loading) return undefined;
        if (handledTaskIdRef.current === linkedTaskId) return undefined;

        const taskElement = document.getElementById(
            `study-task-${encodeURIComponent(linkedTaskId)}`
        );
        if (!taskElement) return undefined;

        handledTaskIdRef.current = linkedTaskId;
        const frame = window.requestAnimationFrame(() => {
            taskElement.scrollIntoView?.({
                behavior: "smooth",
                block: "center"
            });
            taskElement.focus({ preventScroll: true });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [linkedTaskId, loading, tasks]);

    function openAddTask() {
        setEditingTask(null);
        setNewTaskDefaults(null);
        setAddTaskOpen(true);
    }

    function openFlashcardTask() {
        const deck =
            flashcardDecks.find((item) => item.dueCount > 0) ||
            flashcardDecks[0];
        if (!deck) {
            navigate(ROUTES.FLASHCARDS);
            return;
        }
        setEditingTask(null);
        setNewTaskDefaults({
            dueDate: getDateKey(),
            estimatedTime: 30,
            flashcardDeckId: deck.id,
            priority: "Medium",
            subject: deck.subject,
            taskType: "flashcards",
            title: `Study ${deck.title}`
        });
        setAddTaskOpen(true);
    }

    function openEditTask(task) {
        setEditingTask(task);
        setNewTaskDefaults(null);
        setAddTaskOpen(true);
    }

    function closeTaskModal() {
        setAddTaskOpen(false);
        setEditingTask(null);
        setNewTaskDefaults(null);
    }

    const taskSections = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filteredTasks = tasks.filter((task) => {
            const matchesStatus =
                taskFilter === "active"
                    ? !task.completed
                    : taskFilter === "completed"
                      ? task.completed
                      : true;
            const matchesPriority =
                priorityFilter === "all" || task.priority === priorityFilter;
            const matchesSearch =
                !normalizedSearch ||
                task.title.toLowerCase().includes(normalizedSearch) ||
                task.subject.toLowerCase().includes(normalizedSearch);

            return matchesStatus && matchesPriority && matchesSearch;
        });
        const sortedTasks = sortTasksByDueDate(filteredTasks);

        return TASK_GROUPS.map((group) => ({
            ...group,
            tasks: sortedTasks.filter((task) => task.dueGroup === group.id)
        })).filter((group) => group.tasks.length > 0);
    }, [priorityFilter, searchTerm, taskFilter, tasks]);

    const emptyDescription =
        taskFilter === "all" && priorityFilter === "all" && !searchTerm.trim()
            ? "Add a study task to start planning your week."
            : "No tasks match your current search and filters.";

    function startTaskSession(task) {
        startSession({
            sourceType: "task",
            subject: task.subject,
            taskId: task.id,
            title: task.title
        });
    }

    function studyTaskFlashcards(task) {
        navigate(
            `${ROUTES.FLASHCARDS}?deck=${encodeURIComponent(task.flashcardDeckId)}&mode=due`
        );
    }

    function takeTaskQuiz(task) {
        navigate(
            `${ROUTES.QUIZZES}?quiz=${encodeURIComponent(task.quizId)}&mode=take&task=${encodeURIComponent(task.id)}`
        );
    }

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>📅 Study Planner</h1>
                    <p>Plan your study tasks and track weekly progress.</p>
                </div>
                <div className={styles.headerActions}>
                    <Button onClick={openFlashcardTask} variant="outline">
                        Study Flashcards
                    </Button>
                    <Button icon={<AddIcon />} onClick={openAddTask}>
                        Add Study Task
                    </Button>
                </div>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchField}>
                    <Input
                        autoComplete="off"
                        label="Search tasks"
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by title or subject"
                        type="search"
                        value={searchTerm}
                    />
                </div>
                <div className={styles.filterBlock}>
                    <span
                        className={styles.filterLabel}
                        id="status-filter-label"
                    >
                        Status
                    </span>
                    <div
                        aria-labelledby="status-filter-label"
                        className={styles.filters}
                        role="group"
                    >
                        {TASK_FILTERS.map((filter) => (
                            <button
                                aria-pressed={taskFilter === filter.id}
                                className={styles.filterButton}
                                key={filter.id}
                                onClick={() => setTaskFilter(filter.id)}
                                type="button"
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.filterBlock}>
                    <span
                        className={styles.filterLabel}
                        id="priority-filter-label"
                    >
                        Priority
                    </span>
                    <div
                        aria-labelledby="priority-filter-label"
                        className={styles.filters}
                        role="group"
                    >
                        {PRIORITY_FILTERS.map((filter) => (
                            <button
                                aria-pressed={priorityFilter === filter.id}
                                className={styles.filterButton}
                                key={filter.id}
                                onClick={() => setPriorityFilter(filter.id)}
                                type="button"
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Button
                    className={styles.clearButton}
                    disabled={!completedTasks}
                    onClick={() => setClearCompletedOpen(true)}
                    variant="outline"
                >
                    Clear Completed
                </Button>
            </div>

            <Card className={styles.plannerCard}>
                {mutationError ? (
                    <p className={styles.mutationError} role="alert">
                        The task could not be updated. Please try again.
                    </p>
                ) : null}
                {error ? (
                    <LoadErrorState title="Study planner unavailable" />
                ) : (
                    <>
                        {loading ? (
                            <TaskList loading title="Study tasks" />
                        ) : (
                            taskSections.map((section) => (
                                <TaskList
                                    key={section.id}
                                    emphasis={section.id === "overdue"}
                                    highlightedTaskId={linkedTaskId}
                                    onDeleteTask={setDeletingTask}
                                    onEditTask={openEditTask}
                                    onStartSession={startTaskSession}
                                    onStudyFlashcards={studyTaskFlashcards}
                                    onTakeQuiz={takeTaskQuiz}
                                    onToggleTask={toggleTask}
                                    tasks={section.tasks}
                                    taskCount={section.tasks.length}
                                    title={section.label}
                                />
                            ))
                        )}
                        {!loading && !taskSections.length ? (
                            <EmptyState
                                description={emptyDescription}
                                title="No tasks to show"
                            />
                        ) : null}
                        <WeeklyProgress
                            completedTasks={loading ? 0 : completedTasks}
                            activeStudyMinutes={
                                loading ? 0 : activeStudyMinutes
                            }
                            todayStudyMinutes={loading ? 0 : todayStudyMinutes}
                            totalTasks={loading ? 0 : totalTasks}
                            weeklyGoalMinutes={sessionHistory.weeklyGoalMinutes}
                            weeklyMinutes={sessionHistory.weeklyMinutes}
                            weeklyProgress={sessionHistory.weeklyProgress}
                        />
                    </>
                )}
            </Card>

            <StudyAnalytics
                analytics={sessionHistory.analytics}
                error={sessionHistory.error}
                goalError={sessionHistory.goalError}
                goalUpdating={sessionHistory.goalUpdating}
                loading={sessionHistory.loading}
                onUpdateWeeklyGoal={sessionHistory.setWeeklyGoal}
            />

            <StudyHistory
                error={sessionHistory.error}
                loading={sessionHistory.loading}
                sessions={sessionHistory.sessions}
            />

            <AddTaskModal
                decks={flashcardDecks}
                quizzes={quizzes}
                initialValues={newTaskDefaults}
                key={editingTask?.id || "new-task"}
                onAddTask={addTask}
                onClose={closeTaskModal}
                onUpdateTask={editTask}
                open={addTaskOpen}
                task={editingTask}
            />
            <ClearCompletedModal
                count={completedTasks}
                onClose={() => setClearCompletedOpen(false)}
                onConfirm={clearCompleted}
                open={clearCompletedOpen}
            />
            <DeleteTaskModal
                key={deletingTask?.id || "delete-task"}
                onClose={() => setDeletingTask(null)}
                onConfirm={deleteTask}
                open={Boolean(deletingTask)}
                task={deletingTask}
            />
        </main>
    );
}
