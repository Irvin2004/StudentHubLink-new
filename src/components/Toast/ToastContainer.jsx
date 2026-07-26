import { useToast } from "../../hooks/useToast.js";
import Toast from "./Toast.jsx";
import styles from "./Toast.module.css";

export default function ToastContainer() {
    const { dismiss, toasts } = useToast();

    return (
        <aside
            aria-label="Notifications"
            className={styles.container}
            data-testid="toast-container"
        >
            {toasts.map((toast) => (
                <Toast
                    dismissing={toast.dismissing}
                    key={toast.id}
                    message={toast.message}
                    onDismiss={() => dismiss(toast.id)}
                    title={toast.title}
                    type={toast.type}
                />
            ))}
        </aside>
    );
}
