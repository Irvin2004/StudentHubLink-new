import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import { useToast } from "../../../hooks/useToast.js";
import {
    downloadFile,
    getMoreResourceLibraryData,
    getResourceLibraryData,
    recordResourceOpened,
    setResourceFavorite
} from "../../../services/file-service.js";
import { addStudyTask } from "../../studyPlanner/services/study-planner-service.js";
import { createFlashcardDeck } from "../../flashcards/services/flashcard-service.js";
import { getDateKey } from "../../studyPlanner/utils/task-grouping.js";
import { RESOURCE_ACTIONS } from "../utils/resource-library.js";

function getTomorrowKey() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getDateKey(tomorrow);
}

export function useResourceLibrary() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const userId = user?.uid;
    const [resources, setResources] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [favorites, setFavorites] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState(null);
    const [refreshIndex, setRefreshIndex] = useState(0);
    const [pendingFavorites, setPendingFavorites] = useState([]);
    const [plannerResources, setPlannerResources] = useState([]);
    const [deckResources, setDeckResources] = useState([]);
    const cursorsRef = useRef({});
    const loadingMoreRef = useRef(false);
    const pendingActionsRef = useRef(new Set());

    const reload = useCallback(() => {
        setRefreshIndex((current) => current + 1);
    }, []);

    useEffect(() => {
        let active = true;

        async function loadLibrary() {
            if (!userId) return;
            setLoading(true);
            setError(null);

            try {
                const library = await getResourceLibraryData(userId);
                if (active) {
                    setResources(library.resources);
                    setDestinations(library.destinations);
                    setFavorites(library.favorites);
                    cursorsRef.current = library.cursors || {};
                    setHasMore(Boolean(library.hasMore));
                }
            } catch (nextError) {
                if (active) setError(nextError);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadLibrary();
        return () => {
            active = false;
        };
    }, [refreshIndex, userId]);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !hasMore) return [];

        loadingMoreRef.current = true;
        setLoadingMore(true);
        try {
            const page = await getMoreResourceLibraryData(
                destinations,
                cursorsRef.current
            );
            cursorsRef.current = {
                ...cursorsRef.current,
                ...page.cursors
            };
            setHasMore(page.hasMore);
            setResources((current) => {
                const known = new Set(
                    current.map((resource) => resource.resourceKey)
                );
                return [
                    ...current,
                    ...page.resources.filter(
                        (resource) => !known.has(resource.resourceKey)
                    )
                ];
            });
            return page.resources;
        } catch (nextError) {
            setError(nextError);
            throw nextError;
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [destinations, hasMore]);

    const toggleFavorite = useCallback(
        async (resource) => {
            const key = resource.resourceKey;
            const requestKey = `favorite:${key}`;
            if (pendingActionsRef.current.has(requestKey)) return null;
            pendingActionsRef.current.add(requestKey);
            setPendingFavorites((current) => [...current, key]);

            try {
                const favoriteId = await setResourceFavorite(
                    userId,
                    key,
                    favorites[key]
                );
                setFavorites((current) => {
                    const next = { ...current };
                    if (favoriteId) next[key] = favoriteId;
                    else delete next[key];
                    return next;
                });
                setResources((current) =>
                    current.map((item) =>
                        item.resourceKey === key
                            ? {
                                  ...item,
                                  favoriteAt: favoriteId ? new Date() : null
                              }
                            : item
                    )
                );
            } catch {
                showToast({
                    message: "The favourite could not be updated.",
                    type: "error"
                });
            } finally {
                pendingActionsRef.current.delete(requestKey);
                setPendingFavorites((current) =>
                    current.filter((item) => item !== key)
                );
            }
        },
        [favorites, showToast, userId]
    );

    const addResourceToPlanner = useCallback(
        async (resource) => {
            const key = resource.resourceKey;
            const requestKey = `planner:${key}`;
            if (pendingActionsRef.current.has(requestKey)) return null;
            pendingActionsRef.current.add(requestKey);
            setPlannerResources((current) => [...current, key]);

            try {
                await addStudyTask(userId, {
                    title: `Review ${resource.title}`,
                    subject: resource.communityName,
                    notes: `Study resource: ${resource.originalName}`,
                    dueDate: getTomorrowKey(),
                    estimatedMinutes: 30,
                    priority: "Medium",
                    resourceId: resource.resourceKey
                });
                showToast({
                    message: "Resource added to tomorrow's study plan.",
                    type: "success"
                });
            } catch {
                showToast({
                    message: "The resource could not be added to your planner.",
                    type: "error"
                });
            } finally {
                pendingActionsRef.current.delete(requestKey);
                setPlannerResources((current) =>
                    current.filter((item) => item !== key)
                );
            }
        },
        [showToast, userId]
    );

    const openResource = useCallback(
        async (resource) => {
            const requestKey = `open:${resource.resourceKey}`;
            if (pendingActionsRef.current.has(requestKey)) return;
            pendingActionsRef.current.add(requestKey);
            const openedAt = new Date();
            setResources((current) =>
                current.map((item) =>
                    item.resourceKey === resource.resourceKey
                        ? { ...item, lastOpened: openedAt }
                        : item
                )
            );

            try {
                await recordResourceOpened(userId, resource.resourceKey);
            } catch {
                showToast({
                    message:
                        "This resource opened, but its history was not saved.",
                    type: "error"
                });
            } finally {
                pendingActionsRef.current.delete(requestKey);
            }
        },
        [showToast, userId]
    );

    const createDeckFromResource = useCallback(
        async (resource) => {
            const key = resource.resourceKey;
            const requestKey = `deck:${key}`;
            if (pendingActionsRef.current.has(requestKey)) return null;
            pendingActionsRef.current.add(requestKey);
            setDeckResources((current) => [...current, key]);
            try {
                const deck = await createFlashcardDeck(userId, {
                    resourceId: key,
                    subject: resource.communityName,
                    title: resource.title
                });
                window.dispatchEvent(new Event("flashcards-updated"));
                showToast({
                    message: `Flashcard deck “${deck.title}” created.`,
                    type: "success"
                });
                return deck;
            } catch {
                showToast({
                    message: "The flashcard deck could not be created.",
                    type: "error"
                });
                return null;
            } finally {
                pendingActionsRef.current.delete(requestKey);
                setDeckResources((current) =>
                    current.filter((item) => item !== key)
                );
            }
        },
        [showToast, userId]
    );

    const downloadResource = useCallback(
        (resource) => {
            void openResource(resource);
            downloadFile(resource);
        },
        [openResource]
    );

    const runResourceAction = useCallback(
        (action, resource) => {
            switch (action) {
                case RESOURCE_ACTIONS.ADD_TO_PLANNER:
                    return addResourceToPlanner(resource);
                case RESOURCE_ACTIONS.DOWNLOAD:
                    return downloadResource(resource);
                case RESOURCE_ACTIONS.CREATE_FLASHCARD_DECK:
                    return createDeckFromResource(resource);
                case RESOURCE_ACTIONS.OPEN:
                    return openResource(resource);
                case RESOURCE_ACTIONS.TOGGLE_FAVORITE:
                    return toggleFavorite(resource);
                default:
                    throw new TypeError(
                        `Unsupported resource action: ${action}`
                    );
            }
        },
        [
            addResourceToPlanner,
            createDeckFromResource,
            downloadResource,
            openResource,
            toggleFavorite
        ]
    );

    return {
        addResourceToPlanner,
        createDeckFromResource,
        destinations,
        deckResources,
        downloadResource,
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
        openResource,
        runResourceAction,
        toggleFavorite
    };
}
