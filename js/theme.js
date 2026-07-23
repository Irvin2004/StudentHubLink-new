import {
    destroy as destroyTheme,
    initializeTheme
} from "./services/theme-service.js";
import {
    initializePresence
} from "./controllers/presence-controller.js";
import {
    initializeAccessibilityRenderer
} from "./renderers/accessibility-renderer.js";
import {
    initializeNavigationDrawers
} from "./components/navigation-drawer.js?responsive=2";

initializeTheme();
initializeAccessibilityRenderer();
initializeNavigationDrawers();
initializePresence();

window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
        destroyTheme();
    }
}, { once: true });
