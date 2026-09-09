import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import Button from "../../components/ui/Button/index.js";
import Input from "../../components/ui/Input/index.js";
import Select from "../../components/ui/Select/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import AIAssistantDialog from "../aiAssistant/components/AIAssistantDialog.jsx";
import { AI_ACTIONS } from "../aiAssistant/config/ai-action-types.js";
import { useAIAssistant } from "../aiAssistant/hooks/useAIAssistant.js";
import { MAX_STUDY_RESOURCES } from "../aiAssistant/services/resource-context.js";
import {
    DISCOVER_TYPE_LABELS,
    DISCOVER_TYPES,
    filterAndRankDiscoverResults
} from "./models/discover-result.js";
import { createDiscoverStudyContext } from "./services/discover-study-context.js";
import { loadDiscoverCatalog } from "./services/discovery-service.js";
import styles from "./DiscoverPage.module.css";

function ResultSkeletons() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading discovery results"
            className={styles.results}
        >
            {[0, 1, 2, 3].map((item) => (
                <div className={styles.skeleton} key={item}>
                    <Skeleton width="22%" />
                    <Skeleton width="70%" />
                    <Skeleton width="92%" />
                </div>
            ))}
        </div>
    );
}

function formatDate(value) {
    const date = value?.toDate?.() || (value ? new Date(value) : null);
    return date && !Number.isNaN(date.valueOf())
        ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
              date
          )
        : "Recently";
}

export default function DiscoverPage() {
    useDocumentTitle("StudentHub - Discover", "react-app");
    const { user } = useAuth();
    const aiAssistant = useAIAssistant(user?.uid);
    const [catalog, setCatalog] = useState([]);
    const [query, setQuery] = useState(
        () => new URLSearchParams(window.location.search).get("q") || ""
    );
    const [type, setType] = useState("all");
    const [subject, setSubject] = useState("all");
    const [community, setCommunity] = useState("all");
    const [sort, setSort] = useState("relevance");
    const [loading, setLoading] = useState(true);
    const [studyLoadingId, setStudyLoadingId] = useState("");
    const [studyError, setStudyError] = useState("");
    const [error, setError] = useState(null);
    const [reloadIndex, setReloadIndex] = useState(0);

    useEffect(() => {
        let active = true;
        void loadDiscoverCatalog(user)
            .then((results) => {
                if (active) setCatalog(results);
            })
            .catch((nextError) => {
                if (active) setError(nextError);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [reloadIndex, user]);

    const results = useMemo(
        () =>
            filterAndRankDiscoverResults(catalog, {
                community,
                query,
                sort,
                subject,
                type
            }),
        [catalog, community, query, sort, subject, type]
    );
    const subjects = useMemo(
        () =>
            [
                ...new Set(
                    catalog
                        .flatMap((item) => [item.subject, ...item.tags])
                        .filter(Boolean)
                )
            ].sort(),
        [catalog]
    );
    const communities = useMemo(
        () =>
            [
                ...new Map(
                    catalog
                        .filter(
                            (item) => item.communityId && item.communityName
                        )
                        .map((item) => [item.communityId, item.communityName])
                )
            ].sort((left, right) => left[1].localeCompare(right[1])),
        [catalog]
    );

    async function studyWithThuto(result) {
        setStudyLoadingId(result.id);
        setStudyError("");
        try {
            const context = await createDiscoverStudyContext(result, user.uid);
            aiAssistant.openAssistant(AI_ACTIONS.EXPLAIN_TOPIC, context);
        } catch {
            setStudyError(
                "Thuto could not prepare that material. Open it and try again."
            );
        } finally {
            setStudyLoadingId("");
        }
    }

    function reload() {
        setLoading(true);
        setError(null);
        setReloadIndex((value) => value + 1);
    }

    return (
        <main className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Student Knowledge Network</p>
                    <h1>Discover</h1>
                    <p>
                        Find trusted study material across StudentHub, ranked by
                        relevance, helpfulness, and freshness.
                    </p>
                </div>
                <span className={styles.rankingNote}>
                    60% relevance · 25% helpfulness · 15% freshness
                </span>
            </header>

            <section aria-label="Discovery filters" className={styles.filters}>
                <div className={styles.searchField}>
                    <Input
                        autoComplete="off"
                        label="Search StudentHub knowledge"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Try calculus, exam prep, or programming"
                        type="search"
                        value={query}
                    />
                </div>
                <Select
                    label="Content type"
                    onChange={(event) => setType(event.target.value)}
                    value={type}
                >
                    <option value="all">All content</option>
                    {Object.values(DISCOVER_TYPES).map((value) => (
                        <option key={value} value={value}>
                            {DISCOVER_TYPE_LABELS[value]}
                        </option>
                    ))}
                </Select>
                <Select
                    label="Subject or topic"
                    onChange={(event) => setSubject(event.target.value)}
                    value={subject}
                >
                    <option value="all">All subjects</option>
                    {subjects.map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </Select>
                <Select
                    label="Community"
                    onChange={(event) => setCommunity(event.target.value)}
                    value={community}
                >
                    <option value="all">All communities</option>
                    {communities.map(([id, name]) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </Select>
                <Select
                    label="Sort by"
                    onChange={(event) => setSort(event.target.value)}
                    value={sort}
                >
                    <option value="relevance">Best match</option>
                    <option value="newest">Newest</option>
                    <option value="helpful">Most helpful</option>
                </Select>
            </section>

            <div className={styles.resultHeading}>
                <h2>Knowledge results</h2>
                <p aria-live="polite">
                    {results.length}{" "}
                    {results.length === 1 ? "result" : "results"}
                </p>
            </div>
            {studyError ? (
                <p className={styles.studyError} role="alert">
                    {studyError}
                </p>
            ) : null}
            {loading ? (
                <ResultSkeletons />
            ) : error ? (
                <LoadErrorState
                    description="We could not load your accessible StudentHub knowledge."
                    onRetry={reload}
                    title="Discovery is unavailable"
                />
            ) : results.length ? (
                <section
                    aria-label="Knowledge discovery results"
                    className={styles.results}
                >
                    {results.map((result) => (
                        <article className={styles.resultCard} key={result.id}>
                            <div className={styles.cardTopline}>
                                <span data-type={result.type}>
                                    {DISCOVER_TYPE_LABELS[result.type]}
                                </span>
                                {result.subject ? (
                                    <small>{result.subject}</small>
                                ) : null}
                            </div>
                            <div className={styles.cardBody}>
                                <h3>
                                    <Link to={result.url}>{result.title}</Link>
                                </h3>
                                <p>{result.description}</p>
                                <dl className={styles.metadata}>
                                    {result.communityName ? (
                                        <div>
                                            <dt>Community</dt>
                                            <dd>{result.communityName}</dd>
                                        </div>
                                    ) : null}
                                    {result.contributorName ? (
                                        <div>
                                            <dt>Contributor</dt>
                                            <dd>{result.contributorName}</dd>
                                        </div>
                                    ) : null}
                                    <div>
                                        <dt>Updated</dt>
                                        <dd>{formatDate(result.updatedAt)}</dd>
                                    </div>
                                </dl>
                                {result.tags.length ? (
                                    <div className={styles.tags}>
                                        {result.tags.map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <footer className={styles.cardFooter}>
                                <ul aria-label="Helpfulness signals">
                                    {result.signals.map((signal) => (
                                        <li key={signal}>{signal}</li>
                                    ))}
                                </ul>
                                <div>
                                    <Button
                                        size="small"
                                        variant="outline"
                                        onClick={() => {
                                            window.location.assign(result.url);
                                        }}
                                    >
                                        Open
                                    </Button>
                                    {result.studyEligible ? (
                                        <Button
                                            loading={
                                                studyLoadingId === result.id
                                            }
                                            loadingLabel="Preparing"
                                            onClick={() =>
                                                void studyWithThuto(result)
                                            }
                                            size="small"
                                        >
                                            Study with Thuto
                                        </Button>
                                    ) : null}
                                </div>
                            </footer>
                        </article>
                    ))}
                </section>
            ) : (
                <EmptyState
                    description="Try another phrase or clear one of the discovery filters."
                    illustration="search"
                    title="No matching knowledge"
                />
            )}

            <AIAssistantDialog
                action={aiAssistant.action}
                context={aiAssistant.context}
                conversationError={aiAssistant.conversationError}
                conversationLoading={aiAssistant.conversationLoading}
                conversationMessages={aiAssistant.conversationMessages}
                error={aiAssistant.error}
                key={`${aiAssistant.open}-${aiAssistant.context?.id || "discover"}`}
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
        </main>
    );
}
