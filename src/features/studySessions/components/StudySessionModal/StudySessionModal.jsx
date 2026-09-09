import Button from "../../../../components/ui/Button/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import { formatSessionTimer } from "../../utils/study-session-selectors.js";
import styles from "./StudySessionModal.module.css";

export function StudySessionModal({
    elapsedSeconds,
    onCancel,
    onFinish,
    onPause,
    onResume,
    onStart,
    session,
    status
}) {
    if (!session) return null;
    const running = status === "running";
    const paused = status === "paused";
    const finishing = status === "finishing";

    return (
        <Modal
            closeLabel="Cancel study session"
            closeOnOverlay={status === "ready"}
            description={session.subject}
            onClose={status === "ready" ? onCancel : () => {}}
            open
            size="wide"
            title="Study Session"
            footer={
                <div className={styles.actions}>
                    {status === "ready" ? (
                        <Button onClick={onStart}>Start</Button>
                    ) : null}
                    {running ? (
                        <Button onClick={onPause} variant="outline">
                            Pause
                        </Button>
                    ) : null}
                    {paused ? <Button onClick={onResume}>Resume</Button> : null}
                    {status !== "ready" ? (
                        <Button
                            loading={finishing}
                            loadingLabel="Saving"
                            onClick={onFinish}
                            variant="secondary"
                        >
                            Finish Session
                        </Button>
                    ) : null}
                </div>
            }
        >
            <div className={styles.session}>
                <div className={styles.copy}>
                    <h3>{session.title}</h3>
                    <p>{session.subject}</p>
                </div>
                <p
                    aria-label={`Elapsed study time ${formatSessionTimer(elapsedSeconds)}`}
                    aria-live="off"
                    className={styles.timer}
                >
                    {formatSessionTimer(elapsedSeconds)}
                </p>
                <p className={styles.status} aria-live="polite">
                    {status === "ready"
                        ? "Ready to focus"
                        : running
                          ? "Session in progress"
                          : paused
                            ? "Session paused"
                            : "Saving your session"}
                </p>
                {status !== "ready" ? (
                    <p className={styles.minimum}>
                        Complete at least one minute to save this session.
                    </p>
                ) : null}
            </div>
        </Modal>
    );
}

export default StudySessionModal;
