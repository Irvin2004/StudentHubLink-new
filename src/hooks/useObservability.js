import {
    captureError,
    recordRender,
    trackEvent
} from "../services/observability-service.js";
import { getActionableErrorMessage } from "../utils/app-error-mapper.js";

const OBSERVABILITY = Object.freeze({
    captureError,
    getActionableErrorMessage,
    recordRender,
    trackEvent
});

export function useObservability() {
    return OBSERVABILITY;
}
