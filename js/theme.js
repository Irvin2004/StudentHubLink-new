import { initializeTheme } from "./utils/theme.js";
import {
    initializePresence
} from "./controllers/presence-controller.js";
import {
    initializeAccessibilityRenderer
} from "./renderers/accessibility-renderer.js";

initializeTheme();
initializeAccessibilityRenderer();
initializePresence();
