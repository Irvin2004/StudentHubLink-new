import { createContext, useContext } from "react";

export const StudySessionContext = createContext(null);

export function useStudySession() {
    const context = useContext(StudySessionContext);
    if (!context) {
        throw new Error(
            "useStudySession must be used within StudySessionProvider."
        );
    }
    return context;
}
