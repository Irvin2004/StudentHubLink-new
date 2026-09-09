import { useCallback, useEffect, useMemo, useState } from "react";

import { ANALYTICS_EVENTS } from "../../../config/analytics-events.js";
import { useAnalytics } from "../../../hooks/useAnalytics.js";
import AIAssistantDialog from "../../aiAssistant/components/AIAssistantDialog.jsx";
import { AI_ACTIONS } from "../../aiAssistant/config/ai-action-types.js";
import { useAIAssistant } from "../../aiAssistant/hooks/useAIAssistant.js";
import { MAX_STUDY_RESOURCES } from "../../aiAssistant/services/resource-context.js";
import Button from "../../../components/ui/Button/index.js";
import Select from "../../../components/ui/Select/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import { subscribeCommunityReputation } from "../../../services/community-reputation-service.js";
import { KNOWLEDGE_ITEM_TYPE_LABELS } from "../models/knowledge-collection.js";
import { createCollectionStudyContext } from "../services/collection-study-context.js";
import {
    createKnowledgeCollection,
    deleteKnowledgeCollection,
    loadKnowledgeCollectionCandidates,
    reviewCollectionSuggestion,
    subscribeCollectionSaved,
    subscribeCollectionSuggestions,
    subscribeKnowledgeCollections,
    suggestCollectionItem,
    toggleCollectionSaved,
    updateKnowledgeCollection
} from "../services/knowledge-collection-service.js";
import KnowledgeCollectionFormModal from "./KnowledgeCollectionFormModal.jsx";
import styles from "./CommunityKnowledgeCollections.module.css";

function formatDate(value) {
    const date = value?.toDate?.() || (value ? new Date(value) : null);
    return date && !Number.isNaN(date.valueOf())
        ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
              date
          )
        : "Just now";
}

export default function CommunityKnowledgeCollections({ actor, role }) {
    const { track } = useAnalytics();
    const [collections, setCollections] = useState([]);
    const [selectedId, setSelectedId] = useState(() =>
        new URLSearchParams(window.location.search).get("collection")
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reputation, setReputation] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [candidatesLoaded, setCandidatesLoaded] = useState(false);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [suggestionItemId, setSuggestionItemId] = useState("");
    const [suggestionNote, setSuggestionNote] = useState("");
    const [suggestionState, setSuggestionState] = useState({
        collectionId: null,
        items: []
    });
    const [status, setStatus] = useState("");
    const [contextLoading, setContextLoading] = useState(false);
    const aiAssistant = useAIAssistant(actor.id);
    const selected = useMemo(
        () => collections.find((item) => item.id === selectedId) || null,
        [collections, selectedId]
    );
    const isModerator = [
        COMMUNITY_ROLES.OWNER,
        COMMUNITY_ROLES.ADMIN,
        COMMUNITY_ROLES.MODERATOR
    ].includes(role);
    const canCurate = isModerator || Number(reputation?.trustRank || 0) >= 1;
    const suggestionCandidate = candidates.find(
        (item) => item.id === (suggestionItemId || candidates[0]?.id)
    );
    const suggestions =
        suggestionState.collectionId === selected?.id
            ? suggestionState.items
            : [];

    useEffect(
        () =>
            subscribeKnowledgeCollections(
                actor.communityId,
                (items) => {
                    setCollections(items);
                    setSelectedId((current) =>
                        items.some((item) => item.id === current)
                            ? current
                            : items[0]?.id || null
                    );
                    setLoading(false);
                    setError(null);
                },
                (nextError) => {
                    setError(nextError);
                    setLoading(false);
                }
            ),
        [actor.communityId]
    );

    useEffect(
        () =>
            subscribeCommunityReputation(
                actor.communityId,
                actor.id,
                setReputation,
                () => setReputation(null)
            ),
        [actor.communityId, actor.id]
    );

    useEffect(() => {
        if (!selected) return undefined;
        return subscribeCollectionSaved(
            actor.communityId,
            selected.id,
            actor.id,
            setSaved,
            () => setSaved(false)
        );
    }, [actor.communityId, actor.id, selected]);

    useEffect(() => {
        if (!selected || !canCurate) {
            return undefined;
        }
        return subscribeCollectionSuggestions(
            actor.communityId,
            selected.id,
            (items) =>
                setSuggestionState({
                    collectionId: selected.id,
                    items
                }),
            () =>
                setSuggestionState({
                    collectionId: selected.id,
                    items: []
                })
        );
    }, [actor.communityId, canCurate, selected]);

    const ensureCandidates = useCallback(async () => {
        if (candidatesLoaded) return candidates;
        setCandidatesLoading(true);
        try {
            const items = await loadKnowledgeCollectionCandidates(
                actor.communityId,
                actor.id
            );
            setCandidates(items);
            setCandidatesLoaded(true);
            return items;
        } finally {
            setCandidatesLoading(false);
        }
    }, [actor.communityId, actor.id, candidates, candidatesLoaded]);

    async function openForm(collection = null) {
        setStatus("");
        try {
            await ensureCandidates();
            setEditing(collection);
            setFormOpen(true);
        } catch (nextError) {
            setStatus(nextError.message);
        }
    }

    async function studyCollection() {
        setContextLoading(true);
        setStatus("");
        try {
            const context = await createCollectionStudyContext(
                actor.communityId,
                selected
            );
            aiAssistant.openAssistant(AI_ACTIONS.EXPLAIN_TOPIC, context);
            track(ANALYTICS_EVENTS.KNOWLEDGE_COLLECTION_STUDIED, {
                contextResourceCount: context.resources?.length || 1,
                itemCount: selected.items?.length || 0
            });
        } catch (nextError) {
            setStatus(nextError.message);
        } finally {
            setContextLoading(false);
        }
    }

    async function toggleSavedCollection() {
        try {
            const nextSaved = await toggleCollectionSaved(
                actor.communityId,
                selected.id,
                actor.id
            );
            setStatus(
                nextSaved
                    ? "Collection saved to your bookmarks."
                    : "Collection removed from your bookmarks."
            );
        } catch (nextError) {
            setStatus(nextError.message);
        }
    }

    async function reviewSuggestion(suggestionId, decision) {
        try {
            await reviewCollectionSuggestion(
                actor.communityId,
                selected.id,
                suggestionId,
                actor,
                decision
            );
            setStatus(
                decision === "approved"
                    ? "Suggestion approved and added to the collection."
                    : "Suggestion rejected."
            );
        } catch (nextError) {
            setStatus(nextError.message);
        }
    }

    return (
        <div className={styles.board}>
            <header className={styles.header}>
                <div>
                    <p>Community Knowledge Curation</p>
                    <h2>Knowledge Collections</h2>
                    <span>
                        Curated study paths built from this community’s best
                        materials.
                    </span>
                </div>
                {canCurate ? (
                    <Button
                        loading={candidatesLoading}
                        onClick={() => void openForm()}
                    >
                        Create collection
                    </Button>
                ) : null}
            </header>
            {status ? <p role="status">{status}</p> : null}
            {error ? (
                <p role="alert">Collections are unavailable right now.</p>
            ) : null}
            {loading ? <p>Loading knowledge collections…</p> : null}
            <div className={styles.layout}>
                <section
                    aria-label="Community knowledge collections"
                    className={styles.list}
                >
                    {!loading && !collections.length ? (
                        <div className={styles.empty}>
                            <h3>No collections yet</h3>
                            <p>
                                Trusted contributors can assemble the first
                                community study collection.
                            </p>
                        </div>
                    ) : null}
                    {collections.map((collection) => (
                        <button
                            aria-current={
                                selected?.id === collection.id || undefined
                            }
                            key={collection.id}
                            onClick={() => setSelectedId(collection.id)}
                            type="button"
                        >
                            <strong>{collection.title}</strong>
                            <span>
                                {collection.itemCount ||
                                    collection.items.length}{" "}
                                items
                            </span>
                            <small>
                                Updated {formatDate(collection.updatedAt)}
                            </small>
                        </button>
                    ))}
                </section>
                {selected ? (
                    <article className={styles.detail}>
                        <header className={styles.detailHeader}>
                            <div>
                                <h3>{selected.title}</h3>
                                <p>{selected.description}</p>
                            </div>
                            <div className={styles.actions}>
                                <Button
                                    onClick={() => void toggleSavedCollection()}
                                    variant="outline"
                                >
                                    {saved ? "Saved ✓" : "Save Collection"}
                                </Button>
                                <Button
                                    loading={contextLoading}
                                    onClick={() => void studyCollection()}
                                >
                                    Study this collection with Thuto
                                </Button>
                            </div>
                        </header>
                        <div className={styles.tags}>
                            {selected.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                            ))}
                        </div>
                        <p className={styles.meta}>
                            Contributors:{" "}
                            {selected.contributors
                                .map((contributor) => contributor.displayName)
                                .join(", ")}{" "}
                            · Last updated {formatDate(selected.updatedAt)}
                        </p>
                        {canCurate ? (
                            <div className={styles.curatorActions}>
                                <Button
                                    loading={candidatesLoading}
                                    onClick={() => void openForm(selected)}
                                    size="small"
                                    variant="outline"
                                >
                                    Edit collection
                                </Button>
                                {isModerator ? (
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await deleteKnowledgeCollection(
                                                    actor.communityId,
                                                    selected.id
                                                );
                                                setStatus(
                                                    "Collection deleted."
                                                );
                                            } catch (nextError) {
                                                setStatus(nextError.message);
                                            }
                                        }}
                                        size="small"
                                        variant="danger"
                                    >
                                        Delete collection
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}
                        <ol className={styles.items}>
                            {selected.items.map((item, index) => (
                                <li key={item.id}>
                                    <span>{index + 1}</span>
                                    <div>
                                        <small>
                                            {
                                                KNOWLEDGE_ITEM_TYPE_LABELS[
                                                    item.sourceType
                                                ]
                                            }
                                        </small>
                                        <strong>{item.title}</strong>
                                        {item.content ? (
                                            <p>
                                                {item.content.slice(0, 240)}
                                                {item.content.length > 240
                                                    ? "…"
                                                    : ""}
                                            </p>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <section className={styles.suggestions}>
                            <div className={styles.suggestionHeading}>
                                <div>
                                    <h3>Suggest for Collection</h3>
                                    <p>
                                        Recommend useful material without
                                        directly changing this collection.
                                    </p>
                                </div>
                                <Button
                                    loading={candidatesLoading}
                                    onClick={async () => {
                                        try {
                                            await ensureCandidates();
                                            setSuggesting(
                                                (current) => !current
                                            );
                                        } catch (nextError) {
                                            setStatus(nextError.message);
                                        }
                                    }}
                                    size="small"
                                    variant="outline"
                                >
                                    Suggest material
                                </Button>
                            </div>
                            {suggesting ? (
                                <form
                                    className={styles.suggestionForm}
                                    onSubmit={async (event) => {
                                        event.preventDefault();
                                        if (!suggestionCandidate) return;
                                        try {
                                            await suggestCollectionItem(
                                                actor.communityId,
                                                selected.id,
                                                actor,
                                                suggestionCandidate,
                                                suggestionNote
                                            );
                                            setSuggestionNote("");
                                            setSuggesting(false);
                                            setStatus(
                                                "Suggestion sent for curator review."
                                            );
                                        } catch (nextError) {
                                            setStatus(nextError.message);
                                        }
                                    }}
                                >
                                    <Select
                                        label="Material to suggest"
                                        onChange={(event) =>
                                            setSuggestionItemId(
                                                event.target.value
                                            )
                                        }
                                        value={
                                            suggestionItemId ||
                                            candidates[0]?.id ||
                                            ""
                                        }
                                    >
                                        {candidates.map((candidate) => (
                                            <option
                                                key={candidate.id}
                                                value={candidate.id}
                                            >
                                                {
                                                    KNOWLEDGE_ITEM_TYPE_LABELS[
                                                        candidate.sourceType
                                                    ]
                                                }{" "}
                                                · {candidate.title}
                                            </option>
                                        ))}
                                    </Select>
                                    <Textarea
                                        label="Why is this useful? (optional)"
                                        maxLength="500"
                                        onChange={(event) =>
                                            setSuggestionNote(
                                                event.target.value
                                            )
                                        }
                                        rows={2}
                                        value={suggestionNote}
                                    />
                                    <Button type="submit">
                                        Send suggestion
                                    </Button>
                                </form>
                            ) : null}
                            {canCurate && suggestions.length ? (
                                <ul className={styles.reviewQueue}>
                                    {suggestions
                                        .filter(
                                            (suggestion) =>
                                                suggestion.status === "pending"
                                        )
                                        .map((suggestion) => (
                                            <li key={suggestion.id}>
                                                <div>
                                                    <strong>
                                                        {suggestion.item.title}
                                                    </strong>
                                                    <span>
                                                        Suggested by{" "}
                                                        {
                                                            suggestion.proposedByName
                                                        }
                                                        {suggestion.note
                                                            ? ` · ${suggestion.note}`
                                                            : ""}
                                                    </span>
                                                </div>
                                                <div className={styles.actions}>
                                                    <Button
                                                        onClick={() =>
                                                            void reviewSuggestion(
                                                                suggestion.id,
                                                                "approved"
                                                            )
                                                        }
                                                        size="small"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            void reviewSuggestion(
                                                                suggestion.id,
                                                                "rejected"
                                                            )
                                                        }
                                                        size="small"
                                                        variant="outline"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            ) : null}
                        </section>
                    </article>
                ) : (
                    <aside className={styles.prompt}>
                        <h3>Select a collection</h3>
                        <p>
                            Open a collection to follow its ordered study path.
                        </p>
                    </aside>
                )}
            </div>
            {formOpen ? (
                <KnowledgeCollectionFormModal
                    candidates={candidates}
                    initialCollection={editing}
                    key={editing?.id || "new-collection"}
                    onClose={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSave={(input) =>
                        editing
                            ? updateKnowledgeCollection(
                                  actor.communityId,
                                  editing.id,
                                  actor,
                                  input,
                                  editing.contributors
                              )
                            : createKnowledgeCollection(
                                  actor.communityId,
                                  actor,
                                  input
                              )
                    }
                    open
                />
            ) : null}
            <AIAssistantDialog
                action={aiAssistant.action}
                context={aiAssistant.context}
                conversationError={aiAssistant.conversationError}
                conversationLoading={aiAssistant.conversationLoading}
                conversationMessages={aiAssistant.conversationMessages}
                error={aiAssistant.error}
                key={`${aiAssistant.open}-${aiAssistant.context?.id || "collection"}`}
                learningMemory={aiAssistant.learningMemory}
                learningMemoryLoading={aiAssistant.learningMemoryLoading}
                loading={aiAssistant.loading}
                maxStudyMaterials={MAX_STUDY_RESOURCES}
                memoryError={aiAssistant.memoryError}
                newConversationLoading={aiAssistant.newConversationLoading}
                onClose={aiAssistant.closeAssistant}
                onNewConversation={aiAssistant.newConversation}
                onRetry={aiAssistant.retry}
                onRun={aiAssistant.run}
                onSave={aiAssistant.save}
                open={aiAssistant.open}
                result={aiAssistant.result}
                saveError={aiAssistant.saveError}
                saved={aiAssistant.saved}
                saving={aiAssistant.saving}
            />
        </div>
    );
}
