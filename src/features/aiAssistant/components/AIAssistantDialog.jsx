import { useRef, useState } from "react";

import Button from "../../../components/ui/Button/index.js";
import Input from "../../../components/ui/Input/index.js";
import Modal from "../../../components/ui/Modal/index.js";
import Select from "../../../components/ui/Select/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import {
    AI_ACTIONS,
    AI_ACTION_OPTIONS,
    getAIActionLabel
} from "../config/ai-action-types.js";
import GeneratedStudyPlanReview from "./GeneratedStudyPlanReview.jsx";
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

function formatMessageTime(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    }).format(value);
}

export default function AIAssistantDialog({
    action,
    availableStudyMaterials = [],
    context = null,
    conversationError = null,
    conversationLoading = false,
    conversationMessages = [],
    error,
    learningMemory = null,
    learningMemoryLoading = false,
    loading,
    maxStudyMaterials = 3,
    memoryError = null,
    onAddStudyMaterial,
    onClose,
    onNewConversation,
    onRemoveStudyMaterial,
    onRetry,
    onRun,
    onSave,
    open,
    newConversationLoading = false,
    result,
    saveError,
    saved,
    saving,
    studyMaterialLoadingKey = null
}) {
    const [selectedAction, setSelectedAction] = useState(action);
    const [subject, setSubject] = useState(context?.subject || "");
    const [content, setContent] = useState(context?.content || "");
    const [question, setQuestion] = useState("");
    const [showStudyMaterialPicker, setShowStudyMaterialPicker] =
        useState(false);
    const [studyMaterialKey, setStudyMaterialKey] = useState("");
    const [reviewingPlan, setReviewingPlan] = useState(false);
    const inputRef = useRef(null);
    const askingQuestion = selectedAction === AI_ACTIONS.ASK_QUESTION;
    const activeResources = context?.resources || (context ? [context] : []);
    const multipleResources = activeResources.length > 1;
    const materialLimitReached = activeResources.length >= maxStudyMaterials;
    const selectedStudyMaterialKey =
        studyMaterialKey ||
        availableStudyMaterials[0]?.resourceKey ||
        availableStudyMaterials[0]?.id ||
        "";
    const selectedStudyMaterial = availableStudyMaterials.find(
        (resource) =>
            (resource.resourceKey || resource.id) === selectedStudyMaterialKey
    );
    const visibleConversationMessages =
        result && conversationMessages.at(-1)?.role === "assistant"
            ? conversationMessages.slice(0, -1)
            : conversationMessages;

    async function saveReviewedPlan(reviewedResult) {
        const savedResult = await onSave(reviewedResult);
        if (savedResult) setReviewingPlan(false);
        return savedResult;
    }

    return (
        <Modal
            description={
                context
                    ? multipleResources
                        ? "Choose how Thuto should help you study these materials together."
                        : "Choose how Thuto should help you study this resource."
                    : "Paste notes or context. Thuto will turn them into study material."
            }
            initialFocusRef={inputRef}
            onClose={saving ? undefined : onClose}
            open={open}
            size="wide"
            title="Thuto — Your Learning Companion"
            footer={
                <div className={styles.footer}>
                    <Button
                        disabled={saving}
                        onClick={onClose}
                        variant="secondary"
                    >
                        Close
                    </Button>
                    {result?.persistable &&
                    !saved &&
                    result.kind === "study-plan" &&
                    !reviewingPlan ? (
                        <Button onClick={() => setReviewingPlan(true)}>
                            Review study plan
                        </Button>
                    ) : null}
                    {result?.persistable &&
                    !saved &&
                    result.kind !== "study-plan" ? (
                        <Button
                            loading={saving}
                            loadingLabel="Saving"
                            onClick={onSave}
                        >
                            Save {result.kind === "quiz" ? "Quiz" : "Deck"}
                        </Button>
                    ) : null}
                </div>
            }
        >
            {!reviewingPlan ? (
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault();
                        setReviewingPlan(false);
                        void onRun({
                            action: selectedAction,
                            content,
                            question,
                            source: context,
                            subject
                        });
                    }}
                >
                    {context ? (
                        <section
                            aria-label="Active Thuto study materials"
                            className={styles.source}
                        >
                            <div className={styles.sourceHeading}>
                                <div>
                                    <span>Active study materials</span>
                                    <strong>
                                        {activeResources.length} of{" "}
                                        {maxStudyMaterials}
                                    </strong>
                                </div>
                                {onNewConversation ? (
                                    <Button
                                        disabled={
                                            loading || conversationLoading
                                        }
                                        loading={newConversationLoading}
                                        loadingLabel="Starting"
                                        onClick={onNewConversation}
                                        size="small"
                                        type="button"
                                        variant="secondary"
                                    >
                                        New conversation
                                    </Button>
                                ) : null}
                            </div>
                            <ul className={styles.resourceChips}>
                                {activeResources.map((resource) => (
                                    <li key={resource.id}>
                                        <span>{resource.title}</span>
                                        {onRemoveStudyMaterial ? (
                                            <button
                                                aria-label={`Remove ${resource.title}`}
                                                disabled={
                                                    activeResources.length ===
                                                        1 ||
                                                    loading ||
                                                    conversationLoading
                                                }
                                                onClick={() =>
                                                    onRemoveStudyMaterial(
                                                        resource.id
                                                    )
                                                }
                                                title={
                                                    activeResources.length === 1
                                                        ? "Keep at least one study material active"
                                                        : `Remove ${resource.title}`
                                                }
                                                type="button"
                                            >
                                                <span aria-hidden="true">
                                                    ×
                                                </span>
                                            </button>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                            <p>
                                {multipleResources
                                    ? "Thuto will use all active materials for each new response. Removing one switches to that resource set’s conversation."
                                    : context.contextKind === "metadata"
                                      ? "File text is not available yet, so Thuto is using this resource’s saved details."
                                      : "Thuto will use this resource’s content for every action below."}
                            </p>
                            {onAddStudyMaterial ? (
                                <div className={styles.materialActions}>
                                    <Button
                                        disabled={
                                            materialLimitReached ||
                                            !availableStudyMaterials.length ||
                                            loading ||
                                            conversationLoading
                                        }
                                        onClick={() =>
                                            setShowStudyMaterialPicker(
                                                (current) => !current
                                            )
                                        }
                                        size="small"
                                        type="button"
                                        variant="secondary"
                                    >
                                        Add study material
                                    </Button>
                                    {materialLimitReached ? (
                                        <span role="status">
                                            {maxStudyMaterials} material limit
                                            reached
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}
                            {showStudyMaterialPicker &&
                            !materialLimitReached ? (
                                <div className={styles.materialPicker}>
                                    <Select
                                        label="Study material to add"
                                        onChange={(event) =>
                                            setStudyMaterialKey(
                                                event.target.value
                                            )
                                        }
                                        value={selectedStudyMaterialKey}
                                    >
                                        {availableStudyMaterials.map(
                                            (resource) => {
                                                const key =
                                                    resource.resourceKey ||
                                                    resource.id;
                                                return (
                                                    <option
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {resource.title ||
                                                            resource.originalName}
                                                    </option>
                                                );
                                            }
                                        )}
                                    </Select>
                                    <Button
                                        disabled={!selectedStudyMaterial}
                                        loading={
                                            studyMaterialLoadingKey ===
                                            selectedStudyMaterialKey
                                        }
                                        loadingLabel="Adding material"
                                        onClick={() => {
                                            if (selectedStudyMaterial) {
                                                void onAddStudyMaterial(
                                                    selectedStudyMaterial
                                                );
                                            }
                                        }}
                                        size="small"
                                        type="button"
                                    >
                                        Add selected material
                                    </Button>
                                </div>
                            ) : null}
                        </section>
                    ) : null}
                    {conversationLoading ? (
                        <p
                            aria-live="polite"
                            className={styles.conversationStatus}
                        >
                            Restoring this study set’s conversation…
                        </p>
                    ) : visibleConversationMessages.length ? (
                        <section
                            aria-label={`Conversation about ${context?.title || subject}`}
                            className={styles.conversation}
                        >
                            <h3>Conversation</h3>
                            <ol>
                                {visibleConversationMessages.map((message) => (
                                    <li
                                        data-role={message.role}
                                        key={message.id}
                                    >
                                        <div>
                                            <strong>
                                                {message.role === "assistant"
                                                    ? "Thuto"
                                                    : "You"}
                                            </strong>
                                            {formatMessageTime(
                                                message.createdAt
                                            ) ? (
                                                <time>
                                                    {formatMessageTime(
                                                        message.createdAt
                                                    )}
                                                </time>
                                            ) : null}
                                        </div>
                                        <p>{message.content}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    ) : null}
                    {learningMemoryLoading ? (
                        <p aria-live="polite" className={styles.memoryStatus}>
                            Loading what Thuto remembers about your learning…
                        </p>
                    ) : learningMemory?.notices?.length ? (
                        <section
                            aria-label="Thuto learning memory"
                            className={styles.memory}
                        >
                            <div>
                                <span>Learning memory</span>
                                <h3>What Thuto remembers</h3>
                            </div>
                            <ul>
                                {learningMemory.notices.map((notice) => (
                                    <li key={notice}>{notice}</li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                    <div className={styles.fields}>
                        <Select
                            label="Thuto action"
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
                            label={
                                context
                                    ? multipleResources
                                        ? "Study set"
                                        : "Resource title"
                                    : "Subject or topic"
                            }
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="e.g. Robotics"
                            readOnly={Boolean(context)}
                            ref={inputRef}
                            required
                            value={subject}
                        />
                    </div>
                    {askingQuestion ? (
                        <Input
                            label={
                                context
                                    ? multipleResources
                                        ? "Question about these resources"
                                        : "Question about this resource"
                                    : "Question"
                            }
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                            placeholder="e.g. How does acceleration relate to velocity?"
                            ref={context ? inputRef : undefined}
                            required
                            value={question}
                        />
                    ) : null}
                    <Textarea
                        helperText={
                            context
                                ? `${content.length.toLocaleString()} characters from ${activeResources.length} ${activeResources.length === 1 ? "resource" : "resources"}`
                                : `${content.length.toLocaleString()} / 12,000 characters`
                        }
                        label={context ? "Study context" : "Notes or context"}
                        maxLength={12000}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="Paste your notes, key concepts, or the topic you want explained..."
                        readOnly={Boolean(context)}
                        required
                        rows={8}
                        value={content}
                    />
                    <Button
                        disabled={
                            conversationLoading ||
                            learningMemoryLoading ||
                            newConversationLoading
                        }
                        loading={loading}
                        loadingLabel="Thinking"
                        type="submit"
                    >
                        {getAIActionLabel(selectedAction)}
                    </Button>
                </form>
            ) : null}

            {conversationError ? (
                <p className={styles.conversationError} role="alert">
                    Conversation history could not be synced. You can keep
                    studying and try again later.
                </p>
            ) : null}
            {memoryError ? (
                <p className={styles.memoryError} role="status">
                    Learning memory could not be synced. Thuto will continue
                    using the active study materials.
                </p>
            ) : null}

            {loading ? (
                <div aria-live="polite" className={styles.state}>
                    <strong>Working through your notes…</strong>
                    <p>This usually takes only a moment.</p>
                </div>
            ) : error ? (
                <div className={`${styles.state} ${styles.error}`} role="alert">
                    <strong>Thuto request failed</strong>
                    <p>{error.message}</p>
                    <Button onClick={onRetry} size="small" variant="secondary">
                        Try again
                    </Button>
                </div>
            ) : result && !reviewingPlan ? (
                <section aria-live="polite" className={styles.result}>
                    <div className={styles.resultHeading}>
                        <div>
                            <span>Thuto response</span>
                            <h3>{result.title}</h3>
                        </div>
                        <span className={styles.localBadge}>Local preview</span>
                    </div>
                    <ResultContent result={result} />
                </section>
            ) : null}

            {reviewingPlan && result?.kind === "study-plan" ? (
                <GeneratedStudyPlanReview
                    onBack={() => setReviewingPlan(false)}
                    onConfirm={saveReviewedPlan}
                    result={result}
                    saveError={saveError}
                    saving={saving}
                />
            ) : null}

            {saveError && !reviewingPlan ? (
                <p className={styles.saveError} role="alert">
                    {saveError.message}
                </p>
            ) : null}
            {saved ? (
                <p className={styles.saved} role="status">
                    {saved.kind === "study-plan"
                        ? `Added ${saved.count} ${saved.count === 1 ? "task" : "tasks"} to Study Planner.`
                        : `Saved ${saved.count} ${saved.kind === "flashcards" ? "cards" : "questions"}.`}
                </p>
            ) : null}
        </Modal>
    );
}
