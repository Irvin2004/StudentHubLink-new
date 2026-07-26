import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ToastContext } from "./toast-context.js";

const DEFAULT_DURATION = 4000;
const EXIT_DURATION = 160;
const TOAST_TYPES = new Set(["error", "info", "success", "warning"]);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        window.clearTimeout(timers.current.get(id));
        setToasts((current) =>
            current.map((toast) =>
                toast.id === id ? { ...toast, dismissing: true } : toast
            )
        );
        timers.current.set(
            id,
            window.setTimeout(() => {
                timers.current.delete(id);
                setToasts((current) =>
                    current.filter((toast) => toast.id !== id)
                );
            }, EXIT_DURATION)
        );
    }, []);

    const showToast = useCallback(
        ({ title, message, type = "info", duration = DEFAULT_DURATION }) => {
            if (!TOAST_TYPES.has(type)) {
                throw new TypeError(`Unsupported toast type: ${type}.`);
            }

            if (!String(message ?? "").trim()) {
                throw new TypeError("A toast message is required.");
            }

            if (!Number.isFinite(duration) || duration < 0) {
                throw new TypeError(
                    "Toast duration must be a non-negative number."
                );
            }

            const id = ++nextId.current;
            const toast = Object.freeze({
                dismissing: false,
                duration,
                id,
                message: String(message).trim(),
                title: title ? String(title).trim() : "",
                type
            });

            setToasts((current) => [toast, ...current]);

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
