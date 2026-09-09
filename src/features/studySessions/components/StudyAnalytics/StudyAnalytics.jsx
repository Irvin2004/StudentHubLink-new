import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import { formatStudyMinutes } from "../../utils/study-session-selectors.js";
import styles from "./StudyAnalytics.module.css";

function GoalProgress({ progress }) {
    const value = Math.min(100, Math.max(0, Number(progress) || 0));

    return (
        <div className={styles.goalProgress}>
            <div
                aria-label={`Weekly study goal ${value}%`}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={value}
                className={styles.progressTrack}
                role="progressbar"
            >
                <span
                    className={styles.progressFill}
                    style={{ width: `${value}%` }}
                />
            </div>
            <strong>{value}%</strong>
        </div>
    );
}

function WeeklyGoal({
    analytics,
    goalError,
    goalUpdating,
    onUpdateWeeklyGoal
}) {
    const goalOptions = [
        ...new Set([
            60,
            120,
            180,
            300,
            480,
            600,
            720,
            900,
            1200,
            analytics.weeklyGoalMinutes
        ])
    ].sort((first, second) => first - second);

    return (
        <section className={styles.goal} aria-label="Weekly goal">
            <div className={styles.goalHeading}>
                <div>
                    <span>This Week</span>
                    <strong>
                        {formatStudyMinutes(analytics.weeklyMinutes)} /{" "}
                        {formatStudyMinutes(analytics.weeklyGoalMinutes)}
                    </strong>
                </div>
                {onUpdateWeeklyGoal ? (
                    <label className={styles.goalSetting}>
                        <span>Weekly goal</span>
                        <select
                            aria-label="Weekly study goal"
                            disabled={goalUpdating}
                            onChange={(event) =>
                                onUpdateWeeklyGoal(Number(event.target.value))
                            }
                            value={analytics.weeklyGoalMinutes}
                        >
                            {goalOptions.map((minutes) => (
                                <option key={minutes} value={minutes}>
                                    {formatStudyMinutes(minutes)}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}
            </div>
            <GoalProgress progress={analytics.weeklyProgress} />
            {goalError ? (
                <p className={styles.error} role="alert">
                    The weekly goal could not be saved.
                </p>
            ) : null}
        </section>
    );
}

export function StudyAnalytics({
    analytics,
    error,
    goalError,
    goalUpdating,
    loading,
    onUpdateWeeklyGoal
}) {
    if (loading) {
        return (
            <Card as="section" aria-busy="true" className={styles.card}>
                <Skeleton width="35%" />
                <Skeleton height="5rem" />
                <Skeleton height="10rem" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card as="section" className={styles.card}>
                <h2>Study Analytics</h2>
                <p className={styles.error} role="alert">
                    Study analytics could not be loaded.
                </p>
            </Card>
        );
    }

    if (!analytics) return null;
    const hasSessions =
        analytics.weeklyMinutes > 0 || analytics.longestSessionMinutes > 0;
    const dailyMaximum = Math.max(
        1,
        ...analytics.dailyBreakdown.map(({ minutes }) => minutes)
    );
    return (
        <Card as="section" className={styles.card}>
            <header className={styles.header}>
                <div>
                    <h2>Study Analytics</h2>
                    <p>Built from your completed study sessions.</p>
                </div>
            </header>

            {!hasSessions ? (
                <>
                    <WeeklyGoal
                        analytics={analytics}
                        goalError={goalError}
                        goalUpdating={goalUpdating}
                        onUpdateWeeklyGoal={onUpdateWeeklyGoal}
                    />
                    <EmptyState
                        description="Finish a study session to see your time, subjects, and streak."
                        title="No study analytics yet"
                    />
                </>
            ) : (
                <>
                    <WeeklyGoal
                        analytics={analytics}
                        goalError={goalError}
                        goalUpdating={goalUpdating}
                        onUpdateWeeklyGoal={onUpdateWeeklyGoal}
                    />

                    <div className={styles.breakdowns}>
                        <section aria-labelledby="daily-study-title">
                            <h3 id="daily-study-title">This Week by Day</h3>
                            <ol className={styles.dailyList}>
                                {analytics.dailyBreakdown.map((day) => (
                                    <li key={day.date}>
                                        <span>{day.day}</span>
                                        <div
                                            aria-hidden="true"
                                            className={styles.barTrack}
                                        >
                                            <span
                                                className={styles.dayBar}
                                                style={{
                                                    width: `${(day.minutes / dailyMaximum) * 100}%`
                                                }}
                                            />
                                        </div>
                                        <strong>
                                            {formatStudyMinutes(day.minutes)}
                                        </strong>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section aria-labelledby="subject-study-title">
                            <h3 id="subject-study-title">By Subject</h3>
                            {analytics.subjectBreakdown.length ? (
                                <ol className={styles.subjectList}>
                                    {analytics.subjectBreakdown.map(
                                        ({ minutes, subject }) => (
                                            <li key={subject}>
                                                <div>
                                                    <span>{subject}</span>
                                                    <strong>
                                                        {formatStudyMinutes(
                                                            minutes
                                                        )}
                                                    </strong>
                                                </div>
                                                <div
                                                    aria-hidden="true"
                                                    className={styles.barTrack}
                                                >
                                                    <span
                                                        className={
                                                            styles.subjectBar
                                                        }
                                                        style={{
                                                            width: `${(minutes / Math.max(1, analytics.weeklyMinutes)) * 100}%`
                                                        }}
                                                    />
                                                </div>
                                            </li>
                                        )
                                    )}
                                </ol>
                            ) : (
                                <p className={styles.muted}>
                                    No sessions completed this week.
                                </p>
                            )}
                        </section>
                    </div>

                    <dl className={styles.metrics}>
                        <div>
                            <dt>Average Session</dt>
                            <dd>
                                {formatStudyMinutes(
                                    analytics.averageSessionMinutes
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt>Longest Session</dt>
                            <dd>
                                {formatStudyMinutes(
                                    analytics.longestSessionMinutes
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt>Current Streak</dt>
                            <dd>
                                {analytics.streak.current}{" "}
                                {analytics.streak.current === 1
                                    ? "day"
                                    : "days"}
                            </dd>
                        </div>
                    </dl>
                </>
            )}
        </Card>
    );
}

export default StudyAnalytics;
