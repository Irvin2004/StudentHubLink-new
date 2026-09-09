import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/Button.jsx";
import Input from "../../../../components/ui/Input/Input.jsx";
import Modal from "../../../../components/ui/Modal/Modal.jsx";
import Textarea from "../../../../components/ui/Textarea/Textarea.jsx";
import styles from "../quiz-modals.module.css";

const EMPTY_QUESTION = {
    correctOptionIndex: 0,
    options: ["", "", "", ""],
    prompt: ""
};

export function QuestionModal({ onClose, onCreate, onUpdate, open, question }) {
    const editing = Boolean(question);
    const [form, setForm] = useState(() =>
        question
            ? {
                  correctOptionIndex: question.correctOptionIndex,
                  options: [...question.options],
                  prompt: question.prompt
              }
            : EMPTY_QUESTION
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const promptRef = useRef(null);

    function close() {
        setForm({
            correctOptionIndex: 0,
            options: ["", "", "", ""],
            prompt: ""
        });
        setError("");
        onClose();
    }

    function updateOption(index, value) {
        setForm((current) => ({
            ...current,
            options: current.options.map((option, optionIndex) =>
                optionIndex === index ? value : option
            )
        }));
    }

    async function submit(event) {
        event.preventDefault();
        if (new Set(form.options.map((option) => option.trim())).size !== 4) {
            setError("Each answer option must be different.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            if (editing) await onUpdate(question.id, form);
            else await onCreate(form);
            setSubmitting(false);
            close();
        } catch {
            setError("This question could not be saved. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <Modal
            closeOnOverlay={!submitting}
            description="Add four choices and mark the one correct answer."
            initialFocusRef={promptRef}
            onClose={submitting ? undefined : close}
            open={open}
            size="large"
            title={editing ? "Edit Question" : "Add Question"}
        >
            <form className={styles.form} onSubmit={submit}>
                <Textarea
                    label="Question"
                    maxLength="1000"
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            prompt: event.target.value
                        }))
                    }
                    placeholder="What does CPU stand for?"
                    ref={promptRef}
                    required
                    rows={3}
                    value={form.prompt}
                />
                <fieldset className={styles.optionsEditor}>
                    <legend>Answer options</legend>
                    {form.options.map((option, index) => (
                        <div key={index}>
                            <input
                                aria-label={`Mark option ${index + 1} correct`}
                                checked={form.correctOptionIndex === index}
                                name="correct-answer"
                                onChange={() =>
                                    setForm((current) => ({
                                        ...current,
                                        correctOptionIndex: index
                                    }))
                                }
                                type="radio"
                            />
                            <Input
                                label={`Option ${index + 1}`}
                                maxLength="300"
                                onChange={(event) =>
                                    updateOption(index, event.target.value)
                                }
                                required
                                value={option}
                            />
                        </div>
                    ))}
                    <p>Select the radio button beside the correct answer.</p>
                </fieldset>
                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
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
                        loadingLabel="Saving question"
                        type="submit"
                    >
                        {editing ? "Save Changes" : "Add Question"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default QuestionModal;
