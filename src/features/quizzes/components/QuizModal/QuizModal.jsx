import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import Input from "../../../../components/ui/Input/Input.jsx";
import Modal from "../../../../components/ui/Modal/Modal.jsx";
import styles from "../quiz-modals.module.css";

export function QuizModal({ onClose, onCreate, open }) {
    const [form, setForm] = useState({ subject: "", title: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const titleRef = useRef(null);

    function close() {
        setForm({ subject: "", title: "" });
        setError("");
        onClose();
    }

    async function submit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await onCreate(form);
            setSubmitting(false);
            close();
        } catch {
            setError("This quiz could not be created. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <Modal
            closeOnOverlay={!submitting}
            description="Name the quiz and choose the subject it covers."
            initialFocusRef={titleRef}
            onClose={submitting ? undefined : close}
            open={open}
            title="Create Quiz"
        >
            <form className={styles.form} onSubmit={submit}>
                <Input
                    autoComplete="off"
                    label="Quiz title"
                    maxLength="100"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            title: event.target.value
                        }))
                    }
                    placeholder="Programming Quiz"
                    ref={titleRef}
                    required
                    value={form.title}
                />
                <Input
                    autoComplete="off"
                    label="Subject"
                    maxLength="80"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            subject: event.target.value
                        }))
                    }
                    placeholder="Programming"
                    required
                    value={form.subject}
                />
                {error ? <p role="alert">{error}</p> : null}
                <div className={styles.actions}>
                    <Button
                        disabled={submitting}
                        onClick={close}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={submitting}
                        loadingLabel="Creating quiz"
                        type="submit"
                    >
                        Create Quiz
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default QuizModal;
