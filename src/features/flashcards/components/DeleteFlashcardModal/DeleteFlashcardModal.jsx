import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import Modal from "../../../../components/ui/Modal/Modal.jsx";
import styles from "./DeleteFlashcardModal.module.css";

export function DeleteFlashcardModal({
    item,
    itemType = "card",
    onClose,
    onConfirm,
    open
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const cancelRef = useRef(null);
    const isDeck = itemType === "deck";
    const label = isDeck ? item?.title : item?.front;

    async function handleSubmit(event) {
        event.preventDefault();
        setDeleting(true);
        setError("");
        const deleted = await onConfirm?.(item.id);
        if (deleted === false) {
            setError(
                `This ${itemType} could not be deleted. Please try again.`
            );
            setDeleting(false);
            return;
        }
        setDeleting(false);
        onClose?.();
    }

    return (
        <Modal
            closeOnOverlay={!deleting}
            description={
                isDeck
                    ? "This also permanently deletes every card in the deck."
                    : `“${label || "This card"}” will be permanently deleted.`
            }
            initialFocusRef={cancelRef}
            onClose={deleting ? undefined : onClose}
            open={open}
            title={`Delete this ${itemType}?`}
        >
            <form className={styles.form} onSubmit={handleSubmit}>
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
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={deleting}
                        loadingLabel={`Deleting ${itemType}`}
                        type="submit"
                        variant="danger"
                    >
                        {isDeck ? "Delete Deck" : "Delete Card"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default DeleteFlashcardModal;
