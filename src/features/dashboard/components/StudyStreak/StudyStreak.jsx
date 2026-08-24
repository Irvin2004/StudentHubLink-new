/* eslint-disable react-refresh/only-export-components -- the exported message helper is part of this component's public API. */
import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./StudyStreak.module.css";
import { AppIcon } from "../../../../components/common/AppIcon.jsx";

export function getStreakMessage(current = 0) {
    if (current >= 30) return "Amazing consistency! Keep it up!";
    if (current >= 7) return "You're building a great habit!";
    if (current >= 1) return "Great start! Keep going!";
    return "Start your learning journey today!";
}

function ProgressBar({ progress = 0 }) {
    const value = Math.min(100, Math.max(0, Number(progress) || 0));

    return (
        <div
            aria-label={`Study streak progress ${value}%`}
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
        >
            <div
                className={styles.progressFill}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

export function StudyStreak({ loading, onStart, streak }) {
    if (loading) {
        return (
            <section aria-busy="true" className={styles.card}>
                <div className={styles.loading}>
                    <Skeleton width="42%" />
                    <Skeleton height="2.5rem" width="8.5rem" />
                    <Skeleton width="68%" />
                    <Skeleton height="0.75rem" />
                    <Skeleton width="52%" />
                </div>
            </section>
        );
    }

    if (!streak || !Number(streak.current)) {
        return (
            <section className={styles.card}>
                <EmptyState
                    actionLabel="Start Studying"
                    actionVariant="primary"
                    description="Complete a study session today to start your streak."
                    icon="🔥"
                    onAction={onStart}
                    title="No Study Streak Yet"
                />
            </section>
        );
    }

    const current = Math.max(0, Number(streak.current) || 0);
    const longest = Math.max(current, Number(streak.longest) || current);
    const progress = Math.min(100, Math.max(0, Number(streak.progress) || 0));
    const message = getStreakMessage(current);

    return (
        <section aria-label="Study Streak" className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>
                    <AppIcon name="flame" size={20} />
                    <span>Study Streak</span>
                </h2>
            </header>

            <div className={styles.content}>
                <p className={styles.current}>{current} Days</p>
                <p className={styles.message}>{message}</p>
                <ProgressBar progress={progress} />
                <p className={styles.progressValue}>{progress}%</p>
                <p className={styles.goal}>Longest Streak: {longest} Days</p>
            </div>
        </section>
    );
}
