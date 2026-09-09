import { useCallback, useRef, useState } from "react";

import { ANALYTICS_EVENTS } from "../../../config/analytics-events.js";
import { useAnalytics } from "../../../hooks/useAnalytics.js";
import {
    loadLearningMemory,
    recordThutoLearningMemory
} from "../../learningMemory/services/learning-memory-service.js";
import { AI_ACTIONS, getAIActionLabel } from "../config/ai-action-types.js";
import { saveAIResult } from "../services/ai-assistant-persistence.js";
import { runAIAssistant } from "../services/ai-assistant-service.js";
import {
    addThutoMessage,
    loadThutoConversation,
    startNewThutoConversation
} from "../services/thuto-conversation-service.js";

const INITIAL_STATE = {
    action: AI_ACTIONS.EXPLAIN_TOPIC,
    context: null,
    conversationError: null,
    conversationLoading: false,
    conversationMessages: [],
    error: null,
    input: null,
    learningMemory: null,
    learningMemoryLoading: false,
    loading: false,
    memoryError: null,
    newConversationLoading: false,
    open: false,
    result: null,
    saveError: null,
    saved: null,
    saving: false,
    threadId: null
};

function getUserMessageContent(input) {
    if (input.action === AI_ACTIONS.ASK_QUESTION) {
        return String(input.question || "").trim();
    }
    return getAIActionLabel(input.action);
}

function getAssistantMessageContent(result) {
    const lines = [result.title, result.overview];
    if (result.points) lines.push(...result.points);
    if (result.cards) {
        lines.push(
            ...result.cards.map((card) => `${card.front} — ${card.back}`)
        );
    }
    if (result.questions) {
        lines.push(...result.questions.map((question) => question.prompt));
    }
    if (result.tasks) {
        lines.push(
            ...result.tasks.map((task) => `${task.title}: ${task.notes}`)
        );
    }
    return lines.filter(Boolean).join("\n").slice(0, 20_000);
}

export function useAIAssistant(userId) {
    const { track } = useAnalytics();
    const [state, setState] = useState(INITIAL_STATE);
    const loadVersionRef = useRef(0);
    const stateRef = useRef(state);
    stateRef.current = state;

    const openAssistant = useCallback(
        (action = AI_ACTIONS.EXPLAIN_TOPIC, context = null) => {
            const loadVersion = ++loadVersionRef.current;
            const persistent = Boolean(userId && context?.id);
            setState({
                ...INITIAL_STATE,
                action,
                context,
                conversationLoading: persistent,
                learningMemoryLoading: persistent,
                open: true
            });

            if (!persistent) return;
            void loadThutoConversation(userId, context)
                .then(({ messages, threadId }) => {
                    if (loadVersionRef.current !== loadVersion) return;
                    setState((current) =>
                        current.context?.id === context.id
                            ? {
                                  ...current,
                                  conversationLoading: false,
                                  conversationMessages: messages,
                                  threadId
                              }
                            : current
                    );
                })
                .catch((conversationError) => {
                    if (loadVersionRef.current !== loadVersion) return;
                    setState((current) =>
                        current.context?.id === context.id
                            ? {
                                  ...current,
                                  conversationError,
                                  conversationLoading: false
                              }
                            : current
                    );
                });
            void loadLearningMemory(userId, context)
                .then((learningMemory) => {
                    if (loadVersionRef.current !== loadVersion) return;
                    setState((current) =>
                        current.context?.id === context.id
                            ? {
                                  ...current,
                                  learningMemory,
                                  learningMemoryLoading: false
                              }
                            : current
                    );
                })
                .catch((memoryError) => {
                    if (loadVersionRef.current !== loadVersion) return;
                    setState((current) =>
                        current.context?.id === context.id
                            ? {
                                  ...current,
                                  learningMemoryLoading: false,
                                  memoryError
                              }
                            : current
                    );
                });
        },
        [userId]
    );

    const closeAssistant = useCallback(() => {
        setState((current) => ({ ...current, open: false }));
    }, []);

    const execute = useCallback(
        async (input, persistUserMessage = true) => {
            const conversation = stateRef.current;
            const contextId = conversation.context?.id || null;
            const persistent = Boolean(
                userId && conversation.context?.id && conversation.threadId
            );
            setState((current) => ({
                ...current,
                action: input.action,
                error: null,
                input,
                loading: true,
                result: null,
                saveError: null,
                saved: null
            }));

            if (persistent && persistUserMessage) {
                try {
                    const message = await addThutoMessage(
                        userId,
                        conversation.context,
                        conversation.threadId,
                        { content: getUserMessageContent(input), role: "user" }
                    );
                    setState((current) =>
                        current.context?.id === contextId
                            ? {
                                  ...current,
                                  conversationMessages: [
                                      ...current.conversationMessages,
                                      message
                                  ]
                              }
                            : current
                    );
                } catch (conversationError) {
                    setState((current) =>
                        current.context?.id === contextId
                            ? { ...current, conversationError }
                            : current
                    );
                }
            }

            try {
                const result = await runAIAssistant({
                    ...input,
                    learningMemory: conversation.learningMemory?.prompt || ""
                });
                if (persistent) {
                    try {
                        const message = await addThutoMessage(
                            userId,
                            conversation.context,
                            conversation.threadId,
                            {
                                content: getAssistantMessageContent(result),
                                role: "assistant"
                            }
                        );
                        setState((current) =>
                            current.context?.id === contextId
                                ? {
                                      ...current,
                                      conversationMessages: [
                                          ...current.conversationMessages,
                                          message
                                      ]
                                  }
                                : current
                        );
                    } catch (conversationError) {
                        setState((current) =>
                            current.context?.id === contextId
                                ? { ...current, conversationError }
                                : current
                        );
                    }
                }
                if (persistent) {
                    try {
                        await recordThutoLearningMemory(
                            userId,
                            conversation.context,
                            input.action
                        );
                    } catch (memoryError) {
                        setState((current) =>
                            current.context?.id === contextId
                                ? { ...current, memoryError }
                                : current
                        );
                    }
                }
                setState((current) =>
                    current.context?.id === contextId
                        ? { ...current, loading: false, result }
                        : current
                );
                track(ANALYTICS_EVENTS.THUTO_REQUEST_COMPLETED, {
                    action: input.action,
                    contextResourceCount:
                        conversation.context?.resources?.length ||
                        (conversation.context ? 1 : 0),
                    contextual: Boolean(conversation.context),
                    resultKind: result.kind
                });
                return result;
            } catch (error) {
                setState((current) =>
                    current.context?.id === contextId
                        ? { ...current, error, loading: false }
                        : current
                );
                return null;
            }
        },
        [track, userId]
    );

    const run = useCallback((input) => execute(input), [execute]);

    const retry = useCallback(() => {
        if (!state.input) return Promise.resolve(null);
        return execute(state.input, false);
    }, [execute, state.input]);

    const newConversation = useCallback(async () => {
        const conversation = stateRef.current;
        if (!userId || !conversation.context?.id || conversation.loading) {
            return null;
        }
        const contextId = conversation.context.id;
        setState((current) => ({
            ...current,
            conversationError: null,
            newConversationLoading: true
        }));
        try {
            const next = await startNewThutoConversation(
                userId,
                conversation.context
            );
            setState((current) =>
                current.context?.id === contextId
                    ? {
                          ...current,
                          conversationMessages: [],
                          error: null,
                          input: null,
                          newConversationLoading: false,
                          result: null,
                          threadId: next.threadId
                      }
                    : current
            );
            return next;
        } catch (conversationError) {
            setState((current) =>
                current.context?.id === contextId
                    ? {
                          ...current,
                          conversationError,
                          newConversationLoading: false
                      }
                    : current
            );
            return null;
        }
    }, [userId]);

    const save = useCallback(
        async (resultOverride = null) => {
            const resultToSave = resultOverride || state.result;
            if (!resultToSave) return null;
            setState((current) => ({
                ...current,
                saveError: null,
                saving: true
            }));
            try {
                const saved = await saveAIResult(userId, resultToSave);
                setState((current) => ({ ...current, saved, saving: false }));
                track(ANALYTICS_EVENTS.THUTO_RESULT_SAVED, {
                    count: Number(saved?.count) || 0,
                    resultKind: saved?.kind || resultToSave.kind
                });
                return saved;
            } catch (saveError) {
                setState((current) => ({
                    ...current,
                    saveError,
                    saving: false
                }));
                return null;
            }
        },
        [state.result, track, userId]
    );

    return {
        ...state,
        closeAssistant,
        newConversation,
        openAssistant,
        retry,
        run,
        save
    };
}
