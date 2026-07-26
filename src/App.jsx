import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

import AppErrorBoundary from "./components/feedback/AppErrorBoundary.jsx";
import { ToastViewport } from "./components/feedback/ToastViewport.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { useSearch } from "./hooks/useSearch.js";
import { AppRouter } from "./routes/AppRouter.jsx";

const SearchModal = lazy(
    () => import("./components/Search/SearchModal/SearchModal.jsx")
);

function DeferredSearchModal() {
    const { isOpen } = useSearch();
    if (!isOpen) return null;
    return (
        <Suspense fallback={null}>
            <SearchModal />
        </Suspense>
    );
}

export default function App() {
    return (
        <AppErrorBoundary>
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
        </AppErrorBoundary>
    );
}
