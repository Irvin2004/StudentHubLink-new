import Toast from "../ui/Toast/index.js";
import { useToast } from "../../hooks/useToast.js";

export function ToastViewport() {
    const { dismiss, toasts } = useToast();

    return (
        <div className="react-toast-viewport" aria-label="Notifications">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    onDismiss={() => dismiss(toast.id)}
                    title={toast.title}
                    type={toast.type}
                />
            ))}
        </div>
    );
}
