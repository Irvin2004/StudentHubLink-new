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

window.addEventListener("pagehide", destroyTheme, { once: true });
