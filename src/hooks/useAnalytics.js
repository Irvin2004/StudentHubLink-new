import { track } from "../services/analytics-service.js";

const ANALYTICS = Object.freeze({ track });

export function useAnalytics() {
    return ANALYTICS;
}
