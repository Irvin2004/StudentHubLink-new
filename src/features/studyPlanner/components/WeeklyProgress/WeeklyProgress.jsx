import styles from "./WeeklyProgress.module.css";

export function WeeklyProgress({ progress = 0 }) {
    const boundedProgress = Math.min(100, Math.max(0, progress));

    return (
        <section className={styles.section} aria-label="Weekly progress">
            <header className={styles.header}>
                <h2>This Week</h2>
                <span className={styles.divider} />
            </header>
            <div className={styles.progressRow}>
                <span className={styles.label}>Progress:</span>
                <div
                    aria-label={`Weekly progress ${boundedProgress}%`}
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
                <span className={styles.percent}>{boundedProgress}%</span>
            </div>
        </section>
    );
}

export default WeeklyProgress;
