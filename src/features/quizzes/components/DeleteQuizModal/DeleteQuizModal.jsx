import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import Modal from "../../../../components/ui/Modal/Modal.jsx";
import styles from "../quiz-modals.module.css";

export function DeleteQuizModal({ item, itemType, onClose, onConfirm, open }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const cancelRef = useRef(null);
    const isQuiz = itemType === "quiz";

    async function submit(event) {
        event.preventDefault();
        setDeleting(true);
        setError("");
        const removed = await onConfirm(item.id);
        if (removed === false) {
            setError(
                `This ${itemType} could not be deleted. Please try again.`
            );
            setDeleting(false);
            return;
        }
        setDeleting(false);
        onClose();
    }

    return (
        <Modal
            closeOnOverlay={!deleting}
            description={
                isQuiz
                    ? "This permanently deletes its questions and saved attempts."
                    : "This question will be permanently deleted."
            }
            initialFocusRef={cancelRef}
            onClose={deleting ? undefined : onClose}
            open={open}
            title={`Delete this ${itemType}?`}
        >
            <form className={styles.form} onSubmit={submit}>
                <p>This action cannot be undone.</p>
                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
                <div className={styles.actions}>
                    <Button
                        disabled={deleting}
                        onClick={onClose}
                        ref={cancelRef}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={deleting}
                        loadingLabel="Deleting"
                        type="submit"
                        variant="danger"
                    >
                        {isQuiz ? "Delete Quiz" : "Delete Question"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default DeleteQuizModal;
