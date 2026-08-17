import { useCallback, useState } from "react";

import { AI_ACTIONS } from "../config/ai-action-types.js";
import { saveAIResult } from "../services/ai-assistant-persistence.js";
import { runAIAssistant } from "../services/ai-assistant-service.js";

const INITIAL_STATE = {
    action: AI_ACTIONS.EXPLAIN_TOPIC,
    error: null,
    input: null,
    loading: false,
    open: false,
    result: null,
    saveError: null,
    saved: null,
    saving: false
};

export function useAIAssistant(userId) {
    const [state, setState] = useState(INITIAL_STATE);

    const openAssistant = useCallback((action = AI_ACTIONS.EXPLAIN_TOPIC) => {
        setState({ ...INITIAL_STATE, action, open: true });
    }, []);

    const closeAssistant = useCallback(() => {
        setState((current) => ({ ...current, open: false }));
    }, []);

    const run = useCallback(async (input) => {
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
        try {
            const result = await runAIAssistant(input);
            setState((current) => ({ ...current, loading: false, result }));
            return result;
        } catch (error) {
            setState((current) => ({ ...current, error, loading: false }));
            return null;
        }
    }, []);

    const retry = useCallback(() => {
        if (!state.input) return Promise.resolve(null);
        return run(state.input);
    }, [run, state.input]);

    const save = useCallback(async () => {
        if (!state.result) return null;
        setState((current) => ({
            ...current,
            saveError: null,
            saving: true
        }));
        try {
            const saved = await saveAIResult(userId, state.result);
            setState((current) => ({ ...current, saved, saving: false }));
            return saved;
        } catch (saveError) {
            setState((current) => ({ ...current, saveError, saving: false }));
            return null;
        }
    }, [state.result, userId]);

    return {
        ...state,
        closeAssistant,
        openAssistant,
        retry,
        run,
        save
    };
}
