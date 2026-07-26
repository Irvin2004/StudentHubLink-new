import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary/index.js";
import { ToastViewport } from "./components/feedback/ToastViewport.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { useSearch } from "./hooks/useSearch.js";
import { AppRouter } from "./routes/AppRouter.jsx";
import { captureError } from "./services/observability-service.js";

const SearchModal = lazy(
    () => import("./components/Search/SearchModal/SearchModal.jsx")
);

function DeferredSearchModal() {
    const { closeSearch, isOpen } = useSearch();
    if (!isOpen) return null;
    return (
        <Suspense fallback={null}>
            <SearchModal onClose={closeSearch} open={isOpen} />
        </Suspense>
    );
}

function captureAppError(error, errorInfo) {
    captureError(error, {
        component: "ErrorBoundary",
        componentStack: Boolean(errorInfo?.componentStack),
        recoverable: false
    });
}

export default function App() {
    return (
        <ErrorBoundary onError={captureAppError}>
            <BrowserRouter>
                <ThemeProvider>
                    <SettingsProvider>
                        <ToastProvider>
                            <AuthProvider>
                                <SearchProvider>
                                    <NotificationProvider>
                                        <AppRouter />
                                        <DeferredSearchModal />
                                        <ToastViewport />
                                    </NotificationProvider>
                                </SearchProvider>
                            </AuthProvider>
                        </ToastProvider>
                    </SettingsProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}
