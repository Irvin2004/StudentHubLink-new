import { useState } from "react";

import Button from "../../../../components/ui/Button/index.js";
import Input from "../../../../components/ui/Input/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import Select from "../../../../components/ui/Select/index.js";
import styles from "./AddTaskModal.module.css";

const initialForm = {
    title: "",
    subject: "",
    dueDate: "",
    estimatedTime: "",
    priority: "Medium"
};

export function AddTaskModal({ onAddTask, onClose, open }) {
    const [form, setForm] = useState(initialForm);

    function closeModal() {
        setForm(initialForm);
        onClose?.();
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onAddTask?.(form);
        closeModal();
    }

    return (
        <Modal onClose={closeModal} open={open} title="Add Study Task">
            <form className={styles.form} onSubmit={handleSubmit}>
                <Input
                    autoComplete="off"
                    label="Title"
                    name="title"
                    onChange={updateField}
                    placeholder="Programming Assignment"
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
                <Input
                    label="Due date"
                    name="dueDate"
                    onChange={updateField}
                    required
                    type="date"
                    value={form.dueDate}
                />
                <Input
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
                <div className={styles.actions}>
                    <Button
                        onClick={closeModal}
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button type="submit">Add Task</Button>
                </div>
            </form>
        </Modal>
    );
}

export default AddTaskModal;
