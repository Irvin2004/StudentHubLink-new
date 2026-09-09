import styles from "./WeeklyProgress.module.css";
import { formatStudyTime } from "../../utils/task-grouping.js";
import { formatStudyMinutes } from "../../../studySessions/utils/study-session-selectors.js";

export function WeeklyProgress({
    activeStudyMinutes = 0,
    completedTasks = 0,
    weeklyGoalMinutes = 300,
    weeklyMinutes = 0,
    weeklyProgress = 0,
    todayStudyMinutes = 0,
    totalTasks = 0
}) {
    const boundedProgress = Math.min(100, Math.max(0, weeklyProgress));
    const activeTasks = Math.max(0, totalTasks - completedTasks);

    return (
        <section className={styles.section} aria-label="Progress summary">
            <header className={styles.header}>
                <h2>Progress Summary</h2>
                <span className={styles.divider} />
            </header>
            <p className={styles.summaryLine}>
                {activeTasks} active <span aria-hidden="true">•</span>{" "}
                {completedTasks} completed <span aria-hidden="true">•</span>{" "}
                {boundedProgress}% of weekly study goal
            </p>
            <dl className={styles.summary}>
                <div className={styles.stat}>
                    <dt>Total tasks</dt>
                    <dd>{totalTasks}</dd>
                </div>
                <div className={styles.stat}>
                    <dt>Completed</dt>
                    <dd>{completedTasks}</dd>
                </div>
                <div className={styles.stat}>
                    <dt>Weekly Goal</dt>
                    <dd>
                        {formatStudyMinutes(weeklyMinutes)} /{" "}
                        {formatStudyMinutes(weeklyGoalMinutes)}
                    </dd>
                </div>
                <div className={styles.stat}>
                    <dt>Active study time</dt>
                    <dd>{formatStudyTime(activeStudyMinutes)} remaining</dd>
                </div>
                <div className={styles.stat}>
                    <dt>Today’s workload</dt>
                    <dd>{formatStudyTime(todayStudyMinutes)}</dd>
                </div>
            </dl>
            <div
                aria-label={`Weekly study goal ${boundedProgress}%`}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={boundedProgress}
                className={styles.progressTrack}
                role="progressbar"
            >
                <span
                    className={styles.progressFill}
                    style={{ width: `${boundedProgress}%` }}
                />
            </div>
        </section>
    );
}

export default WeeklyProgress;
