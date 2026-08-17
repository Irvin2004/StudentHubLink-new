import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import Input from "../../../../components/ui/Input/Input.jsx";
import Modal from "../../../../components/ui/Modal/Modal.jsx";
import styles from "../FlashcardModalForm.module.css";

export function DeckModal({ onClose, onCreate, open }) {
    const [form, setForm] = useState({ subject: "", title: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const titleRef = useRef(null);

    function closeModal() {
        setForm({ subject: "", title: "" });
        setError("");
        onClose?.();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await onCreate?.(form);
            setSubmitting(false);
            closeModal();
        } catch {
            setError("This deck could not be created. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <Modal
            closeOnOverlay={!submitting}
            description="Give this deck a clear name and subject."
            initialFocusRef={titleRef}
            onClose={submitting ? undefined : closeModal}
            open={open}
            title="Create Deck"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <Input
                    autoComplete="off"
                    label="Deck name"
                    maxLength="100"
                    name="title"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            title: event.target.value
                        }))
                    }
                    placeholder="Robotics Fundamentals"
                    ref={titleRef}
                    required
                    value={form.title}
                />
                <Input
                    autoComplete="off"
                    label="Subject"
                    maxLength="80"
                    name="subject"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            subject: event.target.value
                        }))
                    }
                    placeholder="Robotics"
                    required
                    value={form.subject}
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
                        loadingLabel="Creating deck"
                        type="submit"
                    >
                        Create Deck
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default DeckModal;
