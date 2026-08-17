import { useRef, useState } from "react";

import Button from "../../../components/ui/Button/index.js";
import Input from "../../../components/ui/Input/index.js";
import Modal from "../../../components/ui/Modal/index.js";
import Select from "../../../components/ui/Select/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import {
    AI_ACTION_OPTIONS,
    getAIActionLabel
} from "../config/ai-action-types.js";
import styles from "./AIAssistantDialog.module.css";

function ResultContent({ result }) {
    if (!result) return null;

    if (result.kind === "flashcards") {
        return (
            <ol className={styles.cards}>
                {result.cards.map((card) => (
                    <li key={`${card.front}-${card.back}`}>
                        <strong>{card.front}</strong>
                        <p>{card.back}</p>
                    </li>
                ))}
            </ol>
        );
    }

    if (result.kind === "quiz") {
        return (
            <ol className={styles.questions}>
                {result.questions.map((question) => (
                    <li key={question.prompt}>
                        <strong>{question.prompt}</strong>
                        <ul>
                            {question.options.map((option, index) => (
                                <li
                                    data-correct={
                                        index === question.correctOptionIndex ||
                                        undefined
                                    }
                                    key={option}
                                >
                                    {option}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ol>
        );
    }

    if (result.kind === "study-plan") {
        return (
            <ol className={styles.plan}>
                {result.tasks.map((task) => (
                    <li key={`${task.dueDate}-${task.title}`}>
                        <strong>{task.title}</strong>
                        <span>
                            {task.dueDate} · {task.estimatedMinutes} min
                        </span>
                        <p>{task.notes}</p>
                    </li>
                ))}
            </ol>
        );
    }

    return (
        <div className={styles.answer}>
            {result.overview ? <p>{result.overview}</p> : null}
            <ul>
                {result.points?.map((point) => (
                    <li key={point}>{point}</li>
                ))}
            </ul>
        </div>
    );
}

export default function AIAssistantDialog({
    action,
    error,
    loading,
    onClose,
    onRetry,
    onRun,
    onSave,
    open,
    result,
    saveError,
    saved,
    saving
}) {
    const [selectedAction, setSelectedAction] = useState(action);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const inputRef = useRef(null);

    return (
        <Modal
            description="Paste notes or context. StudentHub's local assistant will turn them into study material."
            initialFocusRef={inputRef}
            onClose={onClose}
            open={open}
            size="wide"
            title="AI Study Assistant"
            footer={
                <div className={styles.footer}>
                    <Button onClick={onClose} variant="secondary">
                        Close
                    </Button>
                    {result?.persistable && !saved ? (
                        <Button
                            loading={saving}
                            loadingLabel="Saving"
                            onClick={onSave}
                        >
                            Save{" "}
                            {result.kind === "study-plan"
                                ? "to Planner"
                                : result.kind === "quiz"
                                  ? "Quiz"
                                  : "Deck"}
                        </Button>
                    ) : null}
                </div>
            }
        >
            <form
                className={styles.form}
                onSubmit={(event) => {
                    event.preventDefault();
                    void onRun({
                        action: selectedAction,
                        content,
                        subject
                    });
                }}
            >
                <div className={styles.fields}>
                    <Select
                        label="Assistant action"
                        onChange={(event) =>
                            setSelectedAction(event.target.value)
                        }
                        value={selectedAction}
                    >
                        {AI_ACTION_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <Input
                        label="Subject or topic"
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="e.g. Robotics"
                        ref={inputRef}
                        required
                        value={subject}
                    />
                </div>
                <Textarea
                    helperText={`${content.length.toLocaleString()} / 12,000 characters`}
                    label="Notes or context"
                    maxLength={12000}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Paste your notes, key concepts, or the topic you want explained..."
                    required
                    rows={8}
                    value={content}
                />
                <Button loading={loading} loadingLabel="Thinking" type="submit">
                    {getAIActionLabel(selectedAction)}
                </Button>
            </form>

            {loading ? (
                <div aria-live="polite" className={styles.state}>
                    <strong>Working through your notes…</strong>
                    <p>This usually takes only a moment.</p>
                </div>
            ) : error ? (
                <div className={`${styles.state} ${styles.error}`} role="alert">
                    <strong>AI request failed</strong>
                    <p>{error.message}</p>
                    <Button onClick={onRetry} size="small" variant="secondary">
                        Try again
                    </Button>
                </div>
            ) : result ? (
                <section aria-live="polite" className={styles.result}>
                    <div className={styles.resultHeading}>
                        <div>
                            <span>AI response</span>
                            <h3>{result.title}</h3>
                        </div>
                        <span className={styles.localBadge}>Local preview</span>
                    </div>
                    <ResultContent result={result} />
                </section>
            ) : null}

            {saveError ? (
                <p className={styles.saveError} role="alert">
                    {saveError.message}
                </p>
            ) : null}
            {saved ? (
                <p className={styles.saved} role="status">
                    Saved {saved.count}{" "}
                    {saved.kind === "flashcards"
                        ? "cards"
                        : saved.kind === "quiz"
                          ? "questions"
                          : "tasks"}
                    .
                </p>
            ) : null}
        </Modal>
    );
}
