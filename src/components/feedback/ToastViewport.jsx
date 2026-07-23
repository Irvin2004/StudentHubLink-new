import { useToast } from "../../hooks/useToast.js";

export function ToastViewport() {
    const { dismiss, toasts } = useToast();

    return (
        <div className="react-toast-viewport" aria-label="Notifications">
            {toasts.map((toast) => {
                const urgent = toast.type === "error";

                return (
                    <section
                        className={`react-toast react-toast--${toast.type}`}
                        key={toast.id}
                        role={urgent ? "alert" : "status"}
                        aria-live={urgent ? "assertive" : "polite"}
                    >
                        <div>
                            {toast.title ? (
                                <strong>{toast.title}</strong>
                            ) : null}
                            <p>{toast.message}</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            onClick={() => dismiss(toast.id)}
                        >
                            ×
                        </button>
                    </section>
                );
            })}
        </div>
    );
}
