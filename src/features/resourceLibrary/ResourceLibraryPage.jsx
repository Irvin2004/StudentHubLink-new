import {
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import FilePreview from "../../components/files/FilePreview/FilePreview.jsx";
import FileCardSkeleton from "../../components/Skeleton/FileCardSkeleton.jsx";
import FileUploader from "../../components/files/FileUploader/FileUploader.jsx";
import Button from "../../components/ui/Button/index.js";
import Input from "../../components/ui/Input/index.js";
import Select from "../../components/ui/Select/index.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { isPreviewableFile } from "../../utils/file-icons.js";
import { useStudySession } from "../studySessions/context/study-session-context.js";
import { ResourceCard } from "./components/ResourceCard/ResourceCard.jsx";
import { useResourceLibrary } from "./hooks/useResourceLibrary.js";
import {
    filterAndSortResources,
    RESOURCE_ACTIONS,
    selectFavoriteResources
} from "./utils/resource-library.js";
import styles from "./ResourceLibraryPage.module.css";

export default function ResourceLibraryPage() {
    useDocumentTitle("StudentHub - Resources", "react-app");
    const { startSession } = useStudySession();

    const {
        destinations,
        deckResources,
        error,
        favorites,
        hasMore,
        loading,
        loadingMore,
        loadMore,
        pendingFavorites,
        plannerResources,
        reload,
        resources,
        runResourceAction
    } = useResourceLibrary();
    const [query, setQuery] = useState("");
    const [type, setType] = useState("all");
    const [community, setCommunity] = useState("all");
    const [sort, setSort] = useState("newest");
    const [view, setView] = useState("grid");
    const [preview, setPreview] = useState(null);
    const searchParameters = useMemo(
        () => new URLSearchParams(window.location.search),
        []
    );
    const [showUploader, setShowUploader] = useState(
        searchParameters.get("action") === "upload"
    );
    const [destinationKey, setDestinationKey] = useState("");
    const handledResourceId = useRef(null);
    const highlightedResourceId = searchParameters.get("resource");
    const deferredQuery = useDeferredValue(query);
    const communities = useMemo(
        () =>
            [
                ...new Map(
                    resources.map((resource) => [
                        resource.communityId,
                        resource.communityName
                    ])
                )
            ].map(([id, name]) => ({ id, name })),
        [resources]
    );
    const visibleResources = useMemo(
        () =>
            filterAndSortResources(resources, {
                community,
                query: deferredQuery,
                sort,
                type
            }),
        [community, deferredQuery, resources, sort, type]
    );
    const favoriteResources = useMemo(
        () => selectFavoriteResources(resources, favorites),
        [favorites, resources]
    );
    const pendingFavoriteKeys = useMemo(
        () => new Set(pendingFavorites),
        [pendingFavorites]
    );
    const plannerResourceKeys = useMemo(
        () => new Set(plannerResources),
        [plannerResources]
    );
    const deckResourceKeys = useMemo(
        () => new Set(deckResources),
        [deckResources]
    );
    const effectiveDestinationKey =
        destinationKey ||
        (destinations[0]
            ? `${destinations[0].communityId}/${destinations[0].channelId}`
            : "");
    const selectedDestination = destinations.find(
        (destination) =>
            `${destination.communityId}/${destination.channelId}` ===
            effectiveDestinationKey
    );
    const filtered = Boolean(
        query.trim() || type !== "all" || community !== "all"
    );

    useEffect(() => {
        const resourceId = searchParameters.get("resource");
        if (!resourceId || handledResourceId.current === resourceId) return;

        const resource = resources.find(
            (item) => item.resourceKey === resourceId || item.id === resourceId
        );
        if (!resource) return;

        let active = true;
        queueMicrotask(() => {
            if (!active) return;
            handledResourceId.current = resourceId;
            const resourceCard = [
                ...document.querySelectorAll("[data-resource-key]")
            ].find(
                (element) =>
                    element.dataset.resourceKey === resource.resourceKey
            );
            resourceCard?.scrollIntoView?.({
                behavior: "smooth",
                block: "center"
            });

            if (isPreviewableFile(resource)) {
                setPreview(resource);
                void runResourceAction(RESOURCE_ACTIONS.OPEN, resource);
            } else {
                void runResourceAction(RESOURCE_ACTIONS.DOWNLOAD, resource);
            }
        });

        return () => {
            active = false;
        };
    }, [resources, runResourceAction, searchParameters]);

    const handleResourceAction = useCallback(
        (action, resource) => {
            if (action === RESOURCE_ACTIONS.START_SESSION) {
                startSession({
                    resourceId: resource.resourceKey,
                    sourceType: "resource",
                    subject: resource.communityName,
                    title: resource.title
                });
                return;
            }
            if (action === RESOURCE_ACTIONS.PREVIEW) {
                if (isPreviewableFile(resource)) {
                    setPreview(resource);
                    void runResourceAction(RESOURCE_ACTIONS.OPEN, resource);
                } else {
                    void runResourceAction(RESOURCE_ACTIONS.DOWNLOAD, resource);
                }
                return;
            }

            void runResourceAction(action, resource);
        },
        [runResourceAction, startSession]
    );

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <p className={styles.eyebrow}>Shared learning materials</p>
                    <h1>Resource Library</h1>
                    <p>
                        Search, preview, save, and turn community resources into
                        study tasks.
                    </p>
                </div>
                <div aria-label="Resource view" className={styles.viewToggle}>
                    <button
                        aria-pressed={view === "grid"}
                        onClick={() => setView("grid")}
                        type="button"
                    >
                        Grid
                    </button>
                    <button
                        aria-pressed={view === "list"}
                        onClick={() => setView("list")}
                        type="button"
                    >
                        List
                    </button>
                </div>
                <Button
                    onClick={() => setShowUploader((current) => !current)}
                    variant="secondary"
                >
                    {showUploader ? "Close Upload" : "Upload Resource"}
                </Button>
            </header>

            {showUploader ? (
                <section className={styles.uploadPanel}>
                    <div className={styles.uploadHeading}>
                        <div>
                            <h2>Upload Resource</h2>
                            <p>
                                Choose a community channel, then select or drop
                                files to share.
                            </p>
                        </div>
                        {destinations.length ? (
                            <Select
                                label="Upload destination"
                                onChange={(event) =>
                                    setDestinationKey(event.target.value)
                                }
                                value={effectiveDestinationKey}
                            >
                                {destinations.map((destination) => {
                                    const key = `${destination.communityId}/${destination.channelId}`;
                                    return (
                                        <option key={key} value={key}>
                                            {destination.communityName} —{" "}
                                            {destination.channelName}
                                        </option>
                                    );
                                })}
                            </Select>
                        ) : null}
                    </div>
                    {selectedDestination ? (
                        <FileUploader
                            channelId={selectedDestination.channelId}
                            communityId={selectedDestination.communityId}
                            onUploaded={reload}
                        />
                    ) : (
                        <p className={styles.uploadEmpty}>
                            Join a community with a channel before uploading a
                            resource.
                        </p>
                    )}
                </section>
            ) : null}

            {!loading && !error && favoriteResources.length ? (
                <section aria-labelledby="favourite-resources-title">
                    <div className={styles.resultsHeader}>
                        <h2 id="favourite-resources-title">
                            Favourite Resources
                        </h2>
                        <p>{favoriteResources.length} saved</p>
                    </div>
                    <div className={`${styles.resources} ${styles.favorites}`}>
                        {favoriteResources.map((resource) => (
                            <ResourceCard
                                addingToPlanner={plannerResourceKeys.has(
                                    resource.resourceKey
                                )}
                                creatingDeck={deckResourceKeys.has(
                                    resource.resourceKey
                                )}
                                favorite
                                favoritePending={pendingFavoriteKeys.has(
                                    resource.resourceKey
                                )}
                                highlighted={
                                    highlightedResourceId ===
                                        resource.resourceKey ||
                                    highlightedResourceId === resource.id
                                }
                                key={resource.resourceKey}
                                onAction={handleResourceAction}
                                resource={resource}
                                view="grid"
                            />
                        ))}
                    </div>
                </section>
            ) : null}

            <section aria-label="Resource controls" className={styles.controls}>
                <div className={styles.search}>
                    <Input
                        autoComplete="off"
                        label="Search resources"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by title or file name"
                        type="search"
                        value={query}
                    />
                </div>
                <Select
                    label="File type"
                    onChange={(event) => setType(event.target.value)}
                    value={type}
                >
                    <option value="all">All types</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Image</option>
                    <option value="document">Document</option>
                    <option value="spreadsheet">Spreadsheet</option>
                    <option value="presentation">Presentation</option>
                </Select>
                <Select
                    label="Community"
                    onChange={(event) => setCommunity(event.target.value)}
                    value={community}
                >
                    <option value="all">All communities</option>
                    {communities.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </Select>
                <Select
                    label="Sort by"
                    onChange={(event) => setSort(event.target.value)}
                    value={sort}
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name</option>
                </Select>
            </section>

            <div className={styles.resultsHeader}>
                <h2>Resources</h2>
                <p aria-live="polite">
                    {visibleResources.length}{" "}
                    {visibleResources.length === 1 ? "resource" : "resources"}
                </p>
            </div>

            {loading ? (
                <FileCardSkeleton count={6} />
            ) : error ? (
                <LoadErrorState
                    description="We could not load resources from your communities."
                    onRetry={reload}
                    title="Resource library unavailable"
                />
            ) : visibleResources.length ? (
                <section
                    aria-label="Resource results"
                    className={`${styles.resources} ${styles[view]}`}
                >
                    {visibleResources.map((resource) => (
                        <ResourceCard
                            addingToPlanner={plannerResourceKeys.has(
                                resource.resourceKey
                            )}
                            creatingDeck={deckResourceKeys.has(
                                resource.resourceKey
                            )}
                            favorite={Boolean(favorites[resource.resourceKey])}
                            favoritePending={pendingFavoriteKeys.has(
                                resource.resourceKey
                            )}
                            highlighted={
                                highlightedResourceId ===
                                    resource.resourceKey ||
                                highlightedResourceId === resource.id
                            }
                            key={resource.resourceKey}
                            onAction={handleResourceAction}
                            resource={resource}
                            view={view}
                        />
                    ))}
                </section>
            ) : (
                <EmptyState
                    description={
                        filtered
                            ? "Try clearing a filter or searching for another file name."
                            : "Resources shared in your communities will appear here."
                    }
                    illustration={filtered ? "search" : "files"}
                    title={
                        filtered ? "No matching resources" : "No resources yet"
                    }
                />
            )}

            {!loading && !error && visibleResources.length && hasMore ? (
                <div className={styles.loadMore}>
                    <Button
                        loading={loadingMore}
                        loadingLabel="Loading resources"
                        onClick={() => void loadMore()}
                        variant="outline"
                    >
                        Load more resources
                    </Button>
                </div>
            ) : null}

            <FilePreview
                file={preview}
                onClose={() => setPreview(null)}
                onDownload={(resource) =>
                    handleResourceAction(RESOURCE_ACTIONS.DOWNLOAD, resource)
                }
            />
        </main>
    );
}
