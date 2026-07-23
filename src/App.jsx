import { BrowserRouter } from "react-router-dom";

import { ToastViewport } from "./components/feedback/ToastViewport.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AppRouter } from "./routes/AppRouter.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <SettingsProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <AppRouter />
                            <ToastViewport />
                        </AuthProvider>
                    </ToastProvider>
                </SettingsProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
