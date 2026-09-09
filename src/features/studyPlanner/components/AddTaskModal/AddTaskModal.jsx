import { useRef, useState } from "react";

import Button from "../../../../components/ui/Button/index.js";
import Input from "../../../../components/ui/Input/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import Select from "../../../../components/ui/Select/index.js";
import Textarea from "../../../../components/ui/Textarea/index.js";
import styles from "./AddTaskModal.module.css";

function getInitialForm(task, initialValues) {
    const source = task || initialValues || {};
    return {
        title: source.title || "",
        subject: source.subject || "",
        notes: source.notes || "",
        dueDate: source.dueDate || "",
        estimatedTime: String(
            source.estimatedMinutes || source.estimatedTime || ""
        ),
        priority: source.priority || "Medium",
        flashcardDeckId: source.flashcardDeckId || "",
        quizId: source.quizId || "",
        taskType: source.taskType || "study"
    };
}

export function AddTaskModal({
    decks = [],
    quizzes = [],
    initialValues = null,
    onAddTask,
    onClose,
    onUpdateTask,
    open,
    task = null
}) {
    const editing = Boolean(task);
    const [form, setForm] = useState(() => getInitialForm(task, initialValues));
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const titleInputRef = useRef(null);

    function closeModal() {
        setForm(getInitialForm(task, initialValues));
        setSubmitError("");
        setSubmitting(false);
        onClose?.();
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitError("");
        setSubmitting(true);

        try {
            const taskInput = { ...form };
            if (!taskInput.quizId && !(editing && task?.quizId)) {
                delete taskInput.quizId;
            }
            if (editing) {
                await onUpdateTask?.(task.id, taskInput);
            } else {
                await onAddTask?.(taskInput);
            }
            closeModal();
        } catch {
            setSubmitError(
                `Could not ${editing ? "update" : "add"} this task. Please try again.`
            );
            setSubmitting(false);
        }
    }

    return (
        <Modal
            description={
                editing
                    ? "Update the task details, then save your changes."
                    : "Add the details for your next study task."
            }
            initialFocusRef={titleInputRef}
            onClose={closeModal}
            open={open}
            title={editing ? "Edit Study Task" : "Add Study Task"}
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <Input
                    autoComplete="off"
                    label="Title"
                    name="title"
                    onChange={updateField}
                    placeholder="Programming Assignment"
                    ref={titleInputRef}
                    required
                    value={form.title}
                />
                <Input
                    autoComplete="off"
                    label="Subject"
                    name="subject"
                    onChange={updateField}
                    placeholder="Programming"
                    required
                    value={form.subject}
                />
                <Textarea
                    helperText="Optional, up to 500 characters."
                    label="Notes"
                    maxLength="500"
                    name="notes"
                    onChange={updateField}
                    placeholder="Add a short reminder or task detail"
                    rows="3"
                    value={form.notes}
                />
                <Select
                    label="Task type"
                    name="taskType"
                    onChange={updateField}
                    value={form.taskType}
                >
                    <option value="study">Study task</option>
                    <option value="flashcards">Study flashcards</option>
                    <option value="quiz">Take quiz</option>
                </Select>
                <Select
                    helperText="Optional. Link this task to one of your quizzes."
                    label="Quiz"
                    name="quizId"
                    onChange={updateField}
                    required={form.taskType === "quiz"}
                    value={form.quizId}
                >
                    <option value="">No linked quiz</option>
                    {quizzes.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                            {quiz.title}
                        </option>
                    ))}
                </Select>
                <Select
                    helperText="Optional. Link this task to one of your flashcard decks."
                    label="Flashcard deck"
                    name="flashcardDeckId"
                    onChange={updateField}
                    required={form.taskType === "flashcards"}
                    value={form.flashcardDeckId}
                >
                    <option value="">No linked deck</option>
                    {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                            {deck.title} ({deck.dueCount || 0} due)
                        </option>
                    ))}
                </Select>
                <Input
                    label="Due date"
                    name="dueDate"
                    onChange={updateField}
                    required
                    type="date"
                    value={form.dueDate}
                />
                <Input
                    helperText="Enter the time in minutes."
                    label="Estimated time"
                    min="1"
                    name="estimatedTime"
                    onChange={updateField}
                    placeholder="90"
                    required
                    type="number"
                    value={form.estimatedTime}
                />
                <Select
                    label="Priority"
                    name="priority"
                    onChange={updateField}
                    required
                    value={form.priority}
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </Select>
                {submitError ? (
                    <p className={styles.error} role="alert">
                        {submitError}
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
                        loadingLabel={editing ? "Saving task" : "Adding task"}
                        type="submit"
                    >
                        {editing ? "Save Changes" : "Add Task"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default AddTaskModal;
