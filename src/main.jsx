import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
    destroy as destroyTheme,
    initializeTheme
} from "../js/services/theme-service.js";
import App from "./App.jsx";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("StudentHub requires a #root element.");
}

initializeTheme();

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);

let stopPerformanceMonitoring = () => {};
const schedulePerformanceMonitoring = window.requestIdleCallback
    ? window.requestIdleCallback.bind(window)
    : (callback) => window.setTimeout(callback, 0);
schedulePerformanceMonitoring(() => {
    void import("./services/observability-service.js").then(
        ({ initializePerformanceMonitoring }) => {
            stopPerformanceMonitoring = initializePerformanceMonitoring();
        }
    );
});

window.addEventListener(
    "pagehide",
    () => {
        stopPerformanceMonitoring();
        destroyTheme();
    },
    { once: true }
);
