import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth.js";
import {
    MESSAGE_DELIVERY_STATUS,
    MESSAGE_PAGE_SIZE
} from "../config/message-types.js";
import { REACTION_KEYS } from "../config/reaction-types.js";
import { createMessageModel } from "../models/message.js";
import { captureError, trackEvent } from "../services/observability-service.js";
import {
    addReaction as addMessageReaction,
    createMessageId,
    deleteMessage as deleteChannelMessage,
    editMessage as editChannelMessage,
    listenToMessages,
    listenToTyping,
    loadOlderMessages,
    pinMessage as pinChannelMessage,
    removeReaction as removeMessageReaction,
    sendMessage as sendChannelMessage,
    sendTyping,
    stopTyping,
    unpinMessage as unpinChannelMessage
} from "../services/message-service.js";

const TYPING_EXPIRY_MS = 5000;
const TYPING_THROTTLE_MS = 2000;

export function useMessages(channelId, { communityId, enabled = true } = {}) {
    const { profile, user } = useAuth();
    const userId = user?.uid;
    const displayName = profile?.displayName || user?.displayName || "Student";
    const photoURL = profile?.photoURL || user?.photoURL || null;
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const shouldSubscribe = Boolean(enabled && communityId && channelId);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasOlder, setHasOlder] = useState(true);
    const [loadedSubscription, setLoadedSubscription] = useState("");
    const [errorState, setErrorState] = useState({
        key: "",
        value: null
    });
    const oldestSnapshotRef = useRef(null);
    const loadingOlderRef = useRef(false);
    const historyRef = useRef([]);
    const optimisticMessagesRef = useRef(new Map());
    const retryInputsRef = useRef(new Map());
    const activeChannelRef = useRef("");
    const typingTimerRef = useRef(null);
    const typingExpiryTimerRef = useRef(null);
    const lastTypingAtRef = useRef(0);
    const subscriptionKey = shouldSubscribe
        ? `${communityId}/${channelId}`
        : "";
    const error = errorState.key === subscriptionKey ? errorState.value : null;
    const loading = Boolean(
        shouldSubscribe && loadedSubscription !== subscriptionKey && !error
    );

    useEffect(() => {
        if (!shouldSubscribe) {
            return undefined;
        }
        const optimisticMessages = optimisticMessagesRef.current;
        const retryInputs = retryInputsRef.current;

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
                liveIds.forEach((id) => {
                    optimisticMessagesRef.current.delete(id);
                    retryInputsRef.current.delete(id);
                });
                setMessages([
                    ...historyRef.current.filter(
                        (message) => !liveIds.has(message.id)
                    ),
                    ...nextMessages,
                    ...optimisticMessagesRef.current.values()
                ]);
                setHasOlder(nextMessages.length >= MESSAGE_PAGE_SIZE);
                setLoadedSubscription(subscriptionKey);
                setErrorState({ key: subscriptionKey, value: null });
            },
            (nextError) => {
                setLoadedSubscription(subscriptionKey);
                setErrorState({ key: subscriptionKey, value: nextError });
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
            (nextError) =>
                setErrorState({ key: subscriptionKey, value: nextError })
        );

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
            clearTimeout(typingTimerRef.current);
            clearTimeout(typingExpiryTimerRef.current);
            if (userId) {
                void stopTyping(communityId, channelId, userId);
            }
            optimisticMessages.clear();
            retryInputs.clear();
            loadingOlderRef.current = false;
        };
    }, [channelId, communityId, shouldSubscribe, subscriptionKey, userId]);

    const persistOptimisticMessage = useCallback(async (messageId) => {
        const input = retryInputsRef.current.get(messageId);
        const optimistic = optimisticMessagesRef.current.get(messageId);
        if (!input || !optimistic) return;

        const sendingMessage = {
            ...optimistic,
            deliveryStatus: MESSAGE_DELIVERY_STATUS.SENDING,
            deliveryError: null
        };
        optimisticMessagesRef.current.set(messageId, sendingMessage);
        setMessages((current) =>
            current.map((message) =>
                message.id === messageId ? sendingMessage : message
            )
        );

        try {
            await sendChannelMessage(input);
            const currentOptimistic =
                optimisticMessagesRef.current.get(messageId);
            if (!currentOptimistic) return;
            const sentMessage = {
                ...currentOptimistic,
                deliveryStatus: MESSAGE_DELIVERY_STATUS.SENT,
                deliveryError: null
            };
            optimisticMessagesRef.current.set(messageId, sentMessage);
            setMessages((current) =>
                current.map((message) =>
                    message.id === messageId ? sentMessage : message
                )
            );
            trackEvent("message_sent", { channelId: input.channelId });
        } catch (nextError) {
            const currentOptimistic =
                optimisticMessagesRef.current.get(messageId);
            if (!currentOptimistic) return;
            const failedMessage = {
                ...currentOptimistic,
                deliveryStatus: MESSAGE_DELIVERY_STATUS.FAILED,
                deliveryError:
                    nextError?.message || "Message could not be sent."
            };
            optimisticMessagesRef.current.set(messageId, failedMessage);
            setMessages((current) =>
                current.map((message) =>
                    message.id === messageId ? failedMessage : message
                )
            );
            captureError(nextError, {
                feature: "send_message",
                recoverable: true
            });
        }
    }, []);

    const sendMessage = useCallback(
        (text, options = {}) => {
            const id = createMessageId(communityId, channelId);
            const createdAt = new Date();
            const input = {
                id,
                communityId,
                channelId,
                channelType: options.channelType,
                senderId: userId,
                senderName: displayName,
                senderPhotoURL: photoURL,
                text,
                attachments: options.attachments || [],
                replyTo: options.replyTo || null
            };
            const optimisticMessage = createMessageModel({
                ...input,
                type: "TEXT",
                reactions: {},
                edited: false,
                deleted: false,
                readBy: userId ? [userId] : [],
                createdAt,
                updatedAt: createdAt,
                deliveryStatus: MESSAGE_DELIVERY_STATUS.SENDING
            });

            optimisticMessagesRef.current.set(id, optimisticMessage);
            retryInputsRef.current.set(id, input);
            setMessages((current) => [...current, optimisticMessage]);
            void persistOptimisticMessage(id);
            return optimisticMessage;
        },
        [
            channelId,
            communityId,
            displayName,
            persistOptimisticMessage,
            photoURL,
            userId
        ]
    );

    const retryMessage = useCallback(
        (messageId) => persistOptimisticMessage(messageId),
        [persistOptimisticMessage]
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

    const togglePin = useCallback(
        (message) => {
            const action = message.pinnedAt
                ? unpinChannelMessage
                : pinChannelMessage;
            return action(communityId, channelId, message.id, userId);
        },
        [channelId, communityId, userId]
    );

    const toggleReaction = useCallback(
        async (message, reaction) => {
            const key = REACTION_KEYS[reaction];
            const hasReacted = key
                ? message.reactions?.[key]?.includes(userId)
                : false;
            const action = hasReacted
                ? removeMessageReaction
                : addMessageReaction;
            const originalUsers = message.reactions?.[key] || [];
            const nextUsers = hasReacted
                ? originalUsers.filter((id) => id !== userId)
                : [...originalUsers, userId];
            const updateReactionUsers = (users) => {
                setMessages((current) =>
                    current.map((item) =>
                        item.id === message.id
                            ? {
                                  ...item,
                                  reactions: {
                                      ...item.reactions,
                                      [key]: users
                                  }
                              }
                            : item
                    )
                );
                const optimistic = optimisticMessagesRef.current.get(
                    message.id
                );
                if (optimistic) {
                    optimisticMessagesRef.current.set(message.id, {
                        ...optimistic,
                        reactions: { ...optimistic.reactions, [key]: users }
                    });
                }
            };

            updateReactionUsers(nextUsers);
            try {
                await action(
                    communityId,
                    channelId,
                    message.id,
                    userId,
                    reaction
                );
                trackEvent("message_reaction_toggled", {
                    channelId,
                    removed: hasReacted
                });
            } catch (nextError) {
                updateReactionUsers(originalUsers);
                captureError(nextError, {
                    feature: "message_reaction",
                    recoverable: true
                });
                throw nextError;
            }
        },
        [channelId, communityId, userId]
    );

    const loadOlder = useCallback(async () => {
        if (loadingOlderRef.current || !hasOlder) return [];

        loadingOlderRef.current = true;
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
            setHasOlder(result.messages.length >= MESSAGE_PAGE_SIZE);
            return result.messages;
        } catch (nextError) {
            setErrorState({ key: subscriptionKey, value: nextError });
            throw nextError;
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    }, [channelId, communityId, hasOlder, subscriptionKey]);

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
        retryMessage,
        sendMessage,
        togglePin,
        toggleReaction,
        typingUsers
    };
}
