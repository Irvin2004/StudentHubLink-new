import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import { useToast } from "../../../hooks/useToast.js";
import {
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    getConnections,
    removeFriend,
    searchPeople,
    sendFriendRequest
} from "../services/friend-service.js";

const EMPTY_CONNECTIONS = { friends: [], incoming: [], outgoing: [] };

export function useFriends() {
    const { profile, user } = useAuth();
    const { showToast } = useToast();
    const currentUser = profile || user;
    const userId = user?.uid || profile?.uid || profile?.id;
    const [connections, setConnections] = useState(EMPTY_CONNECTIONS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshIndex, setRefreshIndex] = useState(0);
    const [pending, setPending] = useState([]);
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const pendingRequestsRef = useRef(new Set());
    const searchRequestRef = useRef({ active: false, sequence: 0, term: "" });

    const reload = useCallback(() => setRefreshIndex((value) => value + 1), []);

    useEffect(() => {
        let active = true;
        async function load() {
            if (!userId) return;
            setLoading(true);
            setError(null);
            try {
                const data = await getConnections(userId);
                if (active) setConnections(data);
            } catch (nextError) {
                if (active) setError(nextError);
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => {
            active = false;
        };
    }, [refreshIndex, userId]);

    const relationByUserId = useMemo(() => {
        const relations = new Map();
        connections.friends.forEach((item) =>
            relations.set(item.person.id, { id: item.id, type: "friend" })
        );
        connections.incoming.forEach((item) =>
            relations.set(item.person.id, { id: item.id, type: "incoming" })
        );
        connections.outgoing.forEach((item) =>
            relations.set(item.person.id, { id: item.id, type: "outgoing" })
        );
        return relations;
    }, [connections]);

    const perform = useCallback(
        async (key, action, successMessage) => {
            if (pendingRequestsRef.current.has(key)) return false;
            pendingRequestsRef.current.add(key);
            setPending((items) => [...items, key]);
            try {
                await action();
                showToast({ message: successMessage, type: "success" });
                reload();
                return true;
            } catch (nextError) {
                showToast({
                    message:
                        nextError?.message ||
                        "The connection could not be updated.",
                    type: "error"
                });
                return false;
            } finally {
                pendingRequestsRef.current.delete(key);
                setPending((items) => items.filter((item) => item !== key));
            }
        },
        [reload, showToast]
    );

    const search = useCallback(
        async (term) => {
            const normalizedTerm = String(term || "").trim();
            if (
                searchRequestRef.current.active &&
                searchRequestRef.current.term === normalizedTerm
            ) {
                return;
            }
            const sequence = searchRequestRef.current.sequence + 1;
            searchRequestRef.current = {
                active: true,
                sequence,
                term: normalizedTerm
            };
            setSearching(true);
            setSearchError(null);
            try {
                const nextResults = await searchPeople(userId, normalizedTerm);
                if (searchRequestRef.current.sequence === sequence) {
                    setResults(nextResults);
                }
            } catch (nextError) {
                if (searchRequestRef.current.sequence === sequence) {
                    setSearchError(nextError);
                    setResults([]);
                }
            } finally {
                if (searchRequestRef.current.sequence === sequence) {
                    searchRequestRef.current.active = false;
                    setSearching(false);
                }
            }
        },
        [userId]
    );

    return {
        ...connections,
        accept: (request) =>
            perform(
                request.id,
                () => acceptFriendRequest(currentUser, request),
                `${request.person.displayName} is now your friend.`
            ),
        cancel: (request) =>
            perform(
                request.id,
                () => cancelFriendRequest(userId, request),
                "Friend request cancelled."
            ),
        decline: (request) =>
            perform(
                request.id,
                () => declineFriendRequest(userId, request),
                "Friend request declined."
            ),
        error,
        loading,
        pending,
        relationByUserId,
        reload,
        remove: (friend) =>
            perform(
                friend.id,
                () => removeFriend(userId, friend),
                `${friend.person.displayName} was removed from your friends.`
            ),
        results,
        search,
        searchError,
        searching,
        send: (person) =>
            perform(
                person.id,
                () => sendFriendRequest(currentUser, person.id),
                `Friend request sent to ${person.displayName}.`
            )
    };
}
