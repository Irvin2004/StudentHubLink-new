import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary/index.js";
import NetworkStatus from "./components/NetworkStatus/NetworkStatus.jsx";
import { ToastContainer } from "./components/Toast/index.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NetworkProvider } from "./context/NetworkContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { useSearch } from "./hooks/useSearch.js";
import { AppRouter } from "./routes/AppRouter.jsx";
import { captureError } from "./services/observability-service.js";
import { StudySessionProvider } from "./features/studySessions/context/StudySessionProvider.jsx";

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
                        <NetworkProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    <StudySessionProvider>
                                        <SearchProvider>
                                            <NotificationProvider>
                                                <AppRouter />
                                                <DeferredSearchModal />
                                                <NetworkStatus />
                                                <ToastContainer />
                                            </NotificationProvider>
                                        </SearchProvider>
                                    </StudySessionProvider>
                                </AuthProvider>
                            </ToastProvider>
                        </NetworkProvider>
                    </SettingsProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}
