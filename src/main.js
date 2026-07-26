// Legacy multi-page bootstrap retained during the incremental React migration.
import "./styles/index.css";

import { initializeNavigationDrawers } from "../js/components/navigation-drawer.js";
import { initializeAccessibilityRenderer } from "../js/renderers/accessibility-renderer.js";
import {
    destroy as destroyTheme,
    initializeTheme
} from "../js/services/theme-service.js";
import { warn } from "../js/utils/logger.js";

let accessibilityController = null;
let navigationDrawerControllers = [];
let presenceController = null;
let initialized = false;

function initializeFirebaseFeatures() {
    void Promise.all([
        import("./firebase/app.js"),
        import("../js/controllers/presence-controller.js")
    ])
        .then(([, { initializePresence }]) => {
            const controller = initializePresence();

            if (!initialized) {
                controller.destroy();
                return;
            }

            presenceController = controller;
        })
        .catch((error) => {
            warn(
                "FIREBASE",
                "Application features could not initialize.",
                error
            );
        });
}

export function initializeApplication() {
    if (initialized) return;

    initializeTheme();
    accessibilityController = initializeAccessibilityRenderer();
    navigationDrawerControllers = initializeNavigationDrawers();
    initialized = true;
    initializeFirebaseFeatures();
}

export function destroyApplication() {
    if (!initialized) return;

    destroyTheme();
    accessibilityController?.destroy();
    accessibilityController = null;
    navigationDrawerControllers.forEach((controller) => controller.destroy());
    navigationDrawerControllers = [];
    presenceController?.destroy();
    presenceController = null;
    initialized = false;
}

initializeApplication();

window.addEventListener(
    "pagehide",
    (event) => {
        if (!event.persisted) destroyApplication();
    },
    { once: true }
);
