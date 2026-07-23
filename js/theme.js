import { initializeTheme } from "./utils/theme.js";
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
