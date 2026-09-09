import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import Modal from "../../../../components/ui/Modal/Modal.jsx";
import Textarea from "../../../../components/ui/Textarea/Textarea.jsx";
import styles from "../FlashcardModalForm.module.css";

function initialForm(card) {
    return {
        back: card?.back || "",
        front: card?.front || ""
    };
}

export function CardModal({ card, onClose, onCreate, onUpdate, open }) {
    const editing = Boolean(card);
    const [form, setForm] = useState(() => initialForm(card));
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const frontRef = useRef(null);

    function closeModal() {
        setForm(initialForm(card));
        setError("");
        onClose?.();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            if (editing) {
                await onUpdate?.(card.id, form);
            } else {
                await onCreate?.(form);
            }
            setSubmitting(false);
            closeModal();
        } catch {
            setError(
                `This card could not be ${editing ? "updated" : "created"}. Please try again.`
            );
            setSubmitting(false);
        }
    }

    return (
        <Modal
            closeOnOverlay={!submitting}
            description={
                editing
                    ? "Update both sides of this card."
                    : "Add the prompt and answer for this card."
            }
            initialFocusRef={frontRef}
            onClose={submitting ? undefined : closeModal}
            open={open}
            size="wide"
            title={editing ? "Edit Card" : "Add Card"}
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <Textarea
                    label="Front"
                    maxLength="1000"
                    name="front"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            front: event.target.value
                        }))
                    }
                    placeholder="What does a PID controller do?"
                    ref={frontRef}
                    required
                    rows="5"
                    value={form.front}
                />
                <Textarea
                    label="Back"
                    maxLength="2000"
                    name="back"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            back: event.target.value
                        }))
                    }
                    placeholder="It continuously calculates an error value..."
                    required
                    rows="6"
                    value={form.back}
                />
                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
                <div className={styles.actions}>
                    <Button
                        disabled={submitting}
                        onClick={closeModal}
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={submitting}
                        loadingLabel={editing ? "Saving card" : "Adding card"}
                        type="submit"
                    >
                        {editing ? "Save Changes" : "Add Card"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default CardModal;
