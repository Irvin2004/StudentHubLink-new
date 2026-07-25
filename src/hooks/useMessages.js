import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth.js";
import { REACTION_KEYS } from "../config/reaction-types.js";
import {
    addReaction as addMessageReaction,
    deleteMessage as deleteChannelMessage,
    editMessage as editChannelMessage,
    listenToMessages,
    listenToTyping,
    loadOlderMessages,
    removeReaction as removeMessageReaction,
    sendMessage as sendChannelMessage,
    sendTyping,
    stopTyping
} from "../services/message-service.js";

const TYPING_EXPIRY_MS = 5000;
const TYPING_THROTTLE_MS = 2000;

export function useMessages(channelId, { communityId } = {}) {
    const { profile, user } = useAuth();
    const userId = user?.uid;
    const displayName = profile?.displayName || user?.displayName || "Student";
    const photoURL = profile?.photoURL || user?.photoURL || null;
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(Boolean(channelId));
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasOlder, setHasOlder] = useState(true);
    const [error, setError] = useState(null);
    const oldestSnapshotRef = useRef(null);
    const historyRef = useRef([]);
    const activeChannelRef = useRef("");
    const typingTimerRef = useRef(null);
    const typingExpiryTimerRef = useRef(null);
    const lastTypingAtRef = useRef(0);

    useEffect(() => {
        if (!communityId || !channelId) {
            return undefined;
        }

        const unsubscribeMessages = listenToMessages(
            communityId,
            channelId,
            ({ messages: nextMessages, oldestSnapshot }) => {
                const channelKey = `${communityId}/${channelId}`;
                if (activeChannelRef.current !== channelKey) {
                    activeChannelRef.current = channelKey;
                    historyRef.current = [];
                }
                oldestSnapshotRef.current = oldestSnapshot;
                const liveIds = new Set(
                    nextMessages.map((message) => message.id)
                );
                setMessages([
                    ...historyRef.current.filter(
                        (message) => !liveIds.has(message.id)
                    ),
                    ...nextMessages
                ]);
                setHasOlder(nextMessages.length >= 30);
                setLoading(false);
            },
            (nextError) => {
                setError(nextError);
                setLoading(false);
            }
        );
        const unsubscribeTyping = listenToTyping(
            communityId,
            channelId,
            (nextUsers) => {
                const now = Date.now();
                const activeUsers = nextUsers.filter((typingUser) => {
                    const value = typingUser.updatedAt;
                    const updatedAt =
                        typeof value?.toMillis === "function"
                            ? value.toMillis()
                            : new Date(value || 0).getTime();

                    return (
                        typingUser.userId !== userId &&
                        now - updatedAt < TYPING_EXPIRY_MS
                    );
                });
                setTypingUsers(activeUsers);
                clearTimeout(typingExpiryTimerRef.current);
                if (activeUsers.length) {
                    typingExpiryTimerRef.current = setTimeout(
                        () => setTypingUsers([]),
                        TYPING_EXPIRY_MS
                    );
                }
            },
            setError
        );

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
            clearTimeout(typingTimerRef.current);
            clearTimeout(typingExpiryTimerRef.current);
            if (userId) {
                void stopTyping(communityId, channelId, userId);
            }
        };
    }, [channelId, communityId, userId]);

    const sendMessage = useCallback(
        (text, options = {}) =>
            sendChannelMessage({
                communityId,
                channelId,
                senderId: userId,
                senderName: displayName,
                senderPhotoURL: photoURL,
                text,
                attachments: options.attachments || [],
                replyTo: options.replyTo || null
            }),
        [channelId, communityId, displayName, photoURL, userId]
    );

    const editMessage = useCallback(
        (messageId, text) =>
            editChannelMessage(communityId, channelId, messageId, text, userId),
        [channelId, communityId, userId]
    );

    const deleteMessage = useCallback(
        (messageId) =>
            deleteChannelMessage(communityId, channelId, messageId, userId),
        [channelId, communityId, userId]
    );

    const toggleReaction = useCallback(
        (message, reaction) => {
            const key = REACTION_KEYS[reaction];
            const hasReacted = key
                ? message.reactions?.[key]?.includes(userId)
                : false;
            const action = hasReacted
                ? removeMessageReaction
                : addMessageReaction;

            return action(communityId, channelId, message.id, userId, reaction);
        },
        [channelId, communityId, userId]
    );

    const loadOlder = useCallback(async () => {
        if (loadingOlder || !hasOlder) return [];

        setLoadingOlder(true);
        try {
            const result = await loadOlderMessages(
                communityId,
                channelId,
                oldestSnapshotRef.current
            );
            oldestSnapshotRef.current = result.oldestSnapshot;
            historyRef.current = [
                ...result.messages,
                ...historyRef.current
            ].filter(
                (message, index, collection) =>
                    collection.findIndex((item) => item.id === message.id) ===
                    index
            );
            setMessages((current) => {
                const ids = new Set(current.map((message) => message.id));
                return [
                    ...result.messages.filter(
                        (message) => !ids.has(message.id)
                    ),
                    ...current
                ];
            });
            setHasOlder(result.messages.length >= 30);
            return result.messages;
        } catch (nextError) {
            setError(nextError);
            throw nextError;
        } finally {
            setLoadingOlder(false);
        }
    }, [channelId, communityId, hasOlder, loadingOlder]);

    const notifyTyping = useCallback(() => {
        if (!userId) return;

        const now = Date.now();
        if (now - lastTypingAtRef.current >= TYPING_THROTTLE_MS) {
            lastTypingAtRef.current = now;
            void sendTyping(communityId, channelId, userId, displayName);
        }

        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            void stopTyping(communityId, channelId, userId);
        }, TYPING_EXPIRY_MS);
    }, [channelId, communityId, displayName, userId]);

    const clearTyping = useCallback(() => {
        clearTimeout(typingTimerRef.current);
        if (userId) {
            void stopTyping(communityId, channelId, userId);
        }
    }, [channelId, communityId, userId]);

    return {
        clearTyping,
        deleteMessage,
        editMessage,
        error,
        hasOlder,
        loadOlder,
        loading,
        loadingOlder,
        messages,
        notifyTyping,
        sendMessage,
        toggleReaction,
        typingUsers
    };
}
