import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import { ROUTES } from "../../../config/routes.js";
import {
    useCommunityQuestions,
    useQuestionAnswers
} from "../hooks/useCommunityQuestions.js";
import { QUESTION_STATUS } from "../models/community-question.js";
import QuestionFormModal from "./QuestionFormModal.jsx";
import styles from "./CommunityQuestions.module.css";

const FILTERS = [
    ["all", "All"],
    [QUESTION_STATUS.UNANSWERED, "Unanswered"],
    [QUESTION_STATUS.ANSWERED, "Answered"],
    [QUESTION_STATUS.SOLVED, "Solved"]
];

function formatDate(value) {
    const date = value?.toDate?.() || (value ? new Date(value) : null);
    return date && !Number.isNaN(date.valueOf())
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short"
          }).format(date)
        : "Just now";
}

function StatusBadge({ status }) {
    return (
        <span className={styles.status} data-status={status}>
            {status[0].toUpperCase() + status.slice(1)}
        </span>
    );
}

function Comments({ answer, api, canModerate, questionId, userId }) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingContent, setEditingContent] = useState("");
    const subscribeComments = api.subscribeComments;

    useEffect(
        () =>
            subscribeComments(questionId, answer.id, setComments, () =>
                setComments([])
            ),
        [answer.id, questionId, subscribeComments]
    );

    async function addComment(event) {
        event.preventDefault();
        await api.createComment(questionId, answer.id, content);
        setContent("");
    }

    return (
        <div className={styles.comments}>
            <h4>Comments</h4>
            {comments.map((comment) => {
                const canManage = canModerate || comment.authorId === userId;
                return (
                    <article className={styles.comment} key={comment.id}>
                        {editingId === comment.id ? (
                            <form
                                onSubmit={async (event) => {
                                    event.preventDefault();
                                    await api.updateComment(
                                        questionId,
                                        answer.id,
                                        comment.id,
                                        editingContent
                                    );
                                    setEditingId(null);
                                }}
                            >
                                <Textarea
                                    aria-label="Edit comment"
                                    onChange={(event) =>
                                        setEditingContent(event.target.value)
                                    }
                                    required
                                    rows={2}
                                    value={editingContent}
                                />
                                <Button size="small" type="submit">
                                    Save
                                </Button>
                            </form>
                        ) : (
                            <>
                                <p>{comment.content}</p>
                                <small>
                                    {comment.authorName} ·{" "}
                                    {formatDate(comment.createdAt)}
                                </small>
                                {canManage ? (
                                    <div className={styles.inlineActions}>
                                        {comment.authorId === userId ? (
                                            <button
                                                onClick={() => {
                                                    setEditingId(comment.id);
                                                    setEditingContent(
                                                        comment.content
                                                    );
                                                }}
                                                type="button"
                                            >
                                                Edit
                                            </button>
                                        ) : null}
                                        <button
                                            onClick={() =>
                                                api.deleteComment(
                                                    questionId,
                                                    answer.id,
                                                    comment.id
                                                )
                                            }
                                            type="button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </article>
                );
            })}
            <form className={styles.commentForm} onSubmit={addComment}>
                <Textarea
                    label="Add a comment"
                    maxLength="1000"
                    onChange={(event) => setContent(event.target.value)}
                    required
                    rows={2}
                    value={content}
                />
                <Button size="small" type="submit">
                    Comment
                </Button>
            </form>
        </div>
    );
}

function Answer({ answer, api, canAccept, canModerate, questionId, userId }) {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(answer.content);
    const canManage = canModerate || answer.authorId === userId;

    return (
        <article
            className={styles.answer}
            data-accepted={answer.accepted || undefined}
        >
            <div className={styles.answerHeader}>
                <div>
                    <strong>{answer.authorName}</strong>
                    <small>{formatDate(answer.createdAt)}</small>
                </div>
                {answer.accepted ? (
                    <span className={styles.accepted}>✓ Accepted Answer</span>
                ) : null}
            </div>
            {editing ? (
                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        await api.updateAnswer(questionId, answer.id, content);
                        setEditing(false);
                    }}
                >
                    <Textarea
                        aria-label="Edit answer"
                        onChange={(event) => setContent(event.target.value)}
                        required
                        rows={5}
                        value={content}
                    />
                    <div className={styles.inlineActions}>
                        <Button size="small" type="submit">
                            Save answer
                        </Button>
                        <Button
                            onClick={() => setEditing(false)}
                            size="small"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : (
                <p className={styles.answerContent}>{answer.content}</p>
            )}
            <div className={styles.answerActions}>
                <Button
                    aria-label={`Upvote answer by ${answer.authorName}`}
                    onClick={() =>
                        api.toggleAnswerUpvote(questionId, answer.id)
                    }
                    size="small"
                    variant="outline"
                >
                    ▲ {answer.upvoteCount || 0} useful
                </Button>
                {canAccept && !answer.accepted ? (
                    <Button
                        onClick={() => api.acceptAnswer(questionId, answer.id)}
                        size="small"
                        variant="outline"
                    >
                        Accept answer
                    </Button>
                ) : null}
                {canManage ? (
                    <>
                        {answer.authorId === userId ? (
                            <button
                                onClick={() => setEditing(true)}
                                type="button"
                            >
                                Edit
                            </button>
                        ) : null}
                        <button
                            onClick={() =>
                                api.deleteAnswer(questionId, answer.id)
                            }
                            type="button"
                        >
                            Delete
                        </button>
                    </>
                ) : null}
            </div>
            <Comments
                answer={answer}
                api={api}
                canModerate={canModerate}
                questionId={questionId}
                userId={userId}
            />
        </article>
    );
}

function QuestionDetail({ api, canModerate, onEdit, question, userId }) {
    const { answers, loading } = useQuestionAnswers(
        question.id,
        api.subscribeAnswers
    );
    const [answer, setAnswer] = useState("");
    const ownsQuestion = question.authorId === userId;

    return (
        <section
            aria-labelledby={`question-${question.id}`}
            className={styles.detail}
        >
            <header className={styles.detailHeader}>
                <div>
                    <StatusBadge status={question.status} />
                    <h3 id={`question-${question.id}`}>{question.title}</h3>
                    <p className={styles.byline}>
                        Asked by {question.authorName} ·{" "}
                        {formatDate(question.createdAt)}
                    </p>
                </div>
                {ownsQuestion || canModerate ? (
                    <div className={styles.inlineActions}>
                        {ownsQuestion ? (
                            <Button
                                onClick={onEdit}
                                size="small"
                                variant="outline"
                            >
                                Edit question
                            </Button>
                        ) : null}
                        <Button
                            onClick={() => api.deleteQuestion(question.id)}
                            size="small"
                            variant="danger"
                        >
                            Delete question
                        </Button>
                    </div>
                ) : null}
            </header>
            <p className={styles.description}>{question.description}</p>
            <div className={styles.tags}>
                {question.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                ))}
            </div>
            {question.linkedResource ? (
                <p className={styles.resource}>
                    Linked material:{" "}
                    <Link
                        to={`${ROUTES.RESOURCES}?resource=${encodeURIComponent(question.linkedResource.id)}`}
                    >
                        {question.linkedResource.title}
                    </Link>
                </p>
            ) : null}
            <div className={styles.answers}>
                <h3>
                    {question.answerCount || answers.length}{" "}
                    {question.answerCount === 1 ? "answer" : "answers"}
                </h3>
                {loading ? <p>Loading answers…</p> : null}
                {answers.map((item) => (
                    <Answer
                        answer={item}
                        api={api}
                        canAccept={ownsQuestion}
                        canModerate={canModerate}
                        key={item.id}
                        questionId={question.id}
                        userId={userId}
                    />
                ))}
            </div>
            <form
                className={styles.answerForm}
                onSubmit={async (event) => {
                    event.preventDefault();
                    await api.createAnswer(question.id, answer);
                    setAnswer("");
                }}
            >
                <Textarea
                    label="Your answer"
                    maxLength="5000"
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Explain the idea clearly and include useful steps or examples."
                    required
                    rows={5}
                    value={answer}
                />
                <Button type="submit">Post answer</Button>
            </form>
        </section>
    );
}

export default function CommunityQuestions({ actor, role }) {
    const api = useCommunityQuestions(actor.communityId, actor);
    const [selectedId, setSelectedId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const selectedQuestion = useMemo(
        () =>
            api.questions.find((question) => question.id === selectedId) ||
            null,
        [api.questions, selectedId]
    );
    const canModerate = [
        COMMUNITY_ROLES.OWNER,
        COMMUNITY_ROLES.ADMIN,
        COMMUNITY_ROLES.MODERATOR
    ].includes(role);

    return (
        <div className={styles.board}>
            <header className={styles.boardHeader}>
                <div>
                    <p className={styles.eyebrow}>Student Knowledge Network</p>
                    <h2>Questions & Answers</h2>
                    <p>Ask focused questions and learn from your community.</p>
                </div>
                <Button onClick={() => setFormOpen(true)}>
                    Ask a question
                </Button>
            </header>
            <div
                aria-label="Filter questions"
                className={styles.filters}
                role="group"
            >
                {FILTERS.map(([value, label]) => (
                    <button
                        aria-pressed={api.filter === value}
                        key={value}
                        onClick={() => {
                            api.setFilter(value);
                            setSelectedId(null);
                        }}
                        type="button"
                    >
                        {label}
                    </button>
                ))}
            </div>
            {api.error ? (
                <p role="alert">Questions are unavailable right now.</p>
            ) : null}
            {api.loading ? <p>Loading questions…</p> : null}
            <div className={styles.layout}>
                <section
                    aria-label="Community questions"
                    className={styles.questionList}
                >
                    {!api.loading && !api.questions.length ? (
                        <div className={styles.empty}>
                            <h3>
                                No{" "}
                                {api.filter === "all" ? "" : `${api.filter} `}
                                questions yet
                            </h3>
                            <p>
                                Start the discussion by asking the first
                                question.
                            </p>
                        </div>
                    ) : null}
                    {api.questions.map((question) => (
                        <button
                            aria-current={
                                selectedId === question.id || undefined
                            }
                            className={styles.questionCard}
                            key={question.id}
                            onClick={() => setSelectedId(question.id)}
                            type="button"
                        >
                            <span className={styles.cardTop}>
                                <StatusBadge status={question.status} />
                                <span>{question.answerCount || 0} answers</span>
                            </span>
                            <strong>{question.title}</strong>
                            <span className={styles.preview}>
                                {question.description}
                            </span>
                            <span className={styles.tags}>
                                {question.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </span>
                        </button>
                    ))}
                </section>
                {selectedQuestion ? (
                    <QuestionDetail
                        api={api}
                        canModerate={canModerate}
                        onEdit={() => {
                            setEditingQuestion(selectedQuestion);
                            setFormOpen(true);
                        }}
                        question={selectedQuestion}
                        userId={actor.id}
                    />
                ) : (
                    <aside className={styles.selectPrompt}>
                        <h3>Select a question</h3>
                        <p>
                            Open a question to read answers, vote, or join the
                            discussion.
                        </p>
                    </aside>
                )}
            </div>
            {formOpen ? (
                <QuestionFormModal
                    initialQuestion={editingQuestion}
                    key={editingQuestion?.id || "new-question"}
                    onClose={() => {
                        setFormOpen(false);
                        setEditingQuestion(null);
                    }}
                    onSave={(input) =>
                        editingQuestion
                            ? api.updateQuestion(editingQuestion.id, input)
                            : api.createQuestion(input)
                    }
                    open
                    resources={api.resources}
                />
            ) : null}
        </div>
    );
}
