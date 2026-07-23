import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ToastContext } from "./toast-context.js";

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        window.clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        ({ title, message, type = "info", duration = DEFAULT_DURATION }) => {
            const id = ++nextId.current;

            setToasts((current) => [...current, { id, title, message, type }]);

            if (duration > 0) {
                timers.current.set(
                    id,
                    window.setTimeout(() => dismiss(id), duration)
                );
            }

            return id;
        },
        [dismiss]
    );

    useEffect(
        () => () => {
            timers.current.forEach((timer) => window.clearTimeout(timer));
            timers.current.clear();
        },
        []
    );

    const value = useMemo(
        () => ({ dismiss, showToast, toasts }),
        [dismiss, showToast, toasts]
    );

    return (
        <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
    );
}
