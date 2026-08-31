import { useRef, useState } from "react";

import Button from "../../../components/ui/Button/index.js";
import Input from "../../../components/ui/Input/index.js";
import Modal from "../../../components/ui/Modal/index.js";
import Select from "../../../components/ui/Select/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import styles from "./QuestionFormModal.module.css";

const EMPTY_FORM = {
    description: "",
    linkedResourceId: "",
    tags: "",
    title: ""
};

export default function QuestionFormModal({
    initialQuestion,
    onClose,
    onSave,
    open,
    resources,
    suggestedTags = []
}) {
    const [form, setForm] = useState(() =>
        initialQuestion
            ? {
                  description: initialQuestion.description,
                  linkedResourceId: initialQuestion.linkedResource?.id || "",
                  tags: initialQuestion.tags.join(", "),
                  title: initialQuestion.title
              }
            : EMPTY_FORM
    );
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const titleRef = useRef(null);

    function update(field) {
        return (event) =>
            setForm((current) => ({
                ...current,
                [field]: event.target.value
            }));
    }

    async function submit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        const resource = resources.find(
            (item) => item.id === form.linkedResourceId
        );
        try {
            await onSave({
                description: form.description,
                linkedResource: resource || null,
                tags: form.tags.split(","),
                title: form.title
            });
            onClose();
        } catch (nextError) {
            setError(nextError.message || "The question could not be saved.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            closeOnOverlay={!submitting}
            description="Give your community enough detail to provide a useful answer."
            initialFocusRef={titleRef}
            onClose={submitting ? undefined : onClose}
            open={open}
            size="large"
            title={initialQuestion ? "Edit question" : "Ask a question"}
        >
            <form className={styles.form} onSubmit={submit}>
                <Input
                    label="Question title"
                    maxLength="160"
                    onChange={update("title")}
                    placeholder="What do you need help understanding?"
                    ref={titleRef}
                    required
                    value={form.title}
                />
                <Textarea
                    label="Description"
                    maxLength="5000"
                    onChange={update("description")}
                    placeholder="Add context, what you have tried, and where you are stuck."
                    required
                    rows={7}
                    value={form.description}
                />
                <Input
                    helperText="Separate up to five tags with commas."
                    label="Subject or topic tags"
                    onChange={update("tags")}
                    placeholder="calculus, limits, mathematics"
                    required
                    value={form.tags}
                />
                {suggestedTags.length ? (
                    <div
                        aria-label="Suggested community topic tags"
                        className={styles.suggestedTags}
                    >
                        {suggestedTags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() =>
                                    setForm((current) => {
                                        const tags = current.tags
                                            .split(",")
                                            .map((item) => item.trim())
                                            .filter(Boolean);
                                        if (
                                            tags.includes(tag.label) ||
                                            tags.length >= 5
                                        )
                                            return current;
                                        return {
                                            ...current,
                                            tags: [...tags, tag.label].join(
                                                ", "
                                            )
                                        };
                                    })
                                }
                                type="button"
                            >
                                + {tag.label}
                            </button>
                        ))}
                    </div>
                ) : null}
                <Select
                    label="Linked resource (optional)"
                    onChange={update("linkedResourceId")}
                    value={form.linkedResourceId}
                >
                    <option value="">No linked resource</option>
                    {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                            {resource.title}
                        </option>
                    ))}
                </Select>
                {error ? <p role="alert">{error}</p> : null}
                <div className={styles.actions}>
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button loading={submitting} type="submit">
                        {initialQuestion ? "Save changes" : "Post question"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
