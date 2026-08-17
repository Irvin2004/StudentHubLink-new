import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import styles from "./DeleteTaskModal.module.css";

export function DeleteTaskModal({ onClose, onConfirm, open, task }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const cancelButtonRef = useRef(null);

    async function handleSubmit(event) {
        event.preventDefault();
        setDeleting(true);
        setError("");
        const deleted = await onConfirm?.(task.id);

        if (deleted === false) {
            setError("This task could not be deleted. Please try again.");
            setDeleting(false);
            return;
        }

        onClose?.();
    }

    return (
        <Modal
            closeOnOverlay={!deleting}
            description={`“${task?.title || "This task"}” will be permanently deleted.`}
            initialFocusRef={cancelButtonRef}
            onClose={deleting ? undefined : onClose}
            open={open}
            title="Delete this task?"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <p className={styles.message}>This action cannot be undone.</p>
                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
                <div className={styles.actions}>
                    <Button
                        disabled={deleting}
                        onClick={onClose}
                        ref={cancelButtonRef}
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        className={styles.deleteButton}
                        loading={deleting}
                        loadingLabel="Deleting task"
                        type="submit"
                    >
                        Delete Task
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default DeleteTaskModal;
