import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import styles from "./ClearCompletedModal.module.css";

export function ClearCompletedModal({ count, onClose, onConfirm, open }) {
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState("");
    const cancelButtonRef = useRef(null);

    async function handleSubmit(event) {
        event.preventDefault();
        setClearing(true);
        setError("");
        const cleared = await onConfirm?.();

        if (cleared === false) {
            setError("Completed tasks could not be cleared. Please try again.");
            setClearing(false);
            return;
        }

        onClose?.();
    }

    return (
        <Modal
            closeOnOverlay={!clearing}
            description={`This will permanently delete ${count} completed ${
                count === 1 ? "task" : "tasks"
            }.`}
            initialFocusRef={cancelButtonRef}
            onClose={clearing ? undefined : onClose}
            open={open}
            title="Clear completed tasks?"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <p className={styles.message}>
                    Active tasks will remain in your planner. This action cannot
                    be undone.
                </p>
                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
                <div className={styles.actions}>
                    <Button
                        disabled={clearing}
                        onClick={onClose}
                        ref={cancelButtonRef}
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={clearing}
                        loadingLabel="Clearing tasks"
                        type="submit"
                    >
                        Clear Completed
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default ClearCompletedModal;
