import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import { useToast } from "../../../hooks/useToast.js";
import { recordStudySessionLearningMemory } from "../../learningMemory/services/learning-memory-service.js";
import { StudySessionModal } from "../components/StudySessionModal/StudySessionModal.jsx";
import { completeStudySession } from "../services/study-session-service.js";
import {
    clearActiveStudySession,
    readActiveStudySession,
    writeActiveStudySession
} from "../utils/active-session-storage.js";
import {
    MINIMUM_SESSION_SECONDS,
    secondsToStudyMinutes
} from "../utils/study-session-selectors.js";
import { StudySessionContext } from "./study-session-context.js";

export function StudySessionProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.uid;
    const { showToast } = useToast();
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState("ready");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const accumulatedSecondsRef = useRef(0);
    const runStartedAtRef = useRef(null);
    const sessionRef = useRef(null);
    const statusRef = useRef("ready");
    const restoredUserRef = useRef(null);

    const liveElapsed = useCallback(() => {
        if (statusRef.current !== "running" || !runStartedAtRef.current) {
            return accumulatedSecondsRef.current;
        }
        return (
            accumulatedSecondsRef.current +
            Math.max(
                0,
                Math.floor((Date.now() - runStartedAtRef.current) / 1000)
            )
        );
    }, []);

    useEffect(() => {
        if (!userId || restoredUserRef.current === userId) return undefined;
        let active = true;

        async function restoreSession() {
            await Promise.resolve();
            if (!active) return;
            const recovered = readActiveStudySession(userId);
            restoredUserRef.current = userId;
            if (!recovered) return;

            sessionRef.current = recovered.session;
            statusRef.current = recovered.status;
            accumulatedSecondsRef.current = recovered.accumulatedSeconds;
            runStartedAtRef.current = recovered.runStartedAt;
            setSession(recovered.session);
            setStatus(recovered.status);
            setElapsedSeconds(
                recovered.status === "running" && recovered.runStartedAt
                    ? Math.max(
                          0,
                          recovered.accumulatedSeconds +
                              Math.floor(
                                  (Date.now() - recovered.runStartedAt) / 1000
                              )
                      )
                    : recovered.accumulatedSeconds
            );
        }

        void restoreSession();
        return () => {
            active = false;
        };
    }, [userId]);

    useEffect(() => {
        if (status !== "running") return undefined;
        const interval = window.setInterval(
            () => setElapsedSeconds(liveElapsed()),
            250
        );
        return () => window.clearInterval(interval);
    }, [liveElapsed, status]);

    const startSession = useCallback(
        (source) => {
            if (sessionRef.current || readActiveStudySession(userId)) {
                showToast({
                    message:
                        "Finish or cancel your current study session first.",
                    type: "warning"
                });
                return false;
            }

            const nextSession = {
                title: source.title,
                subject: source.subject || "General",
                sourceType: source.sourceType,
                taskId: source.taskId || null,
                resourceId: source.resourceId || null,
                startedAt: null
            };
            sessionRef.current = nextSession;
            statusRef.current = "ready";
            accumulatedSecondsRef.current = 0;
            runStartedAtRef.current = null;
            setSession(nextSession);
            setElapsedSeconds(0);
            setStatus("ready");
            writeActiveStudySession(userId, {
                accumulatedSeconds: 0,
                runStartedAt: null,
                session: nextSession,
                status: "ready"
            });
            return true;
        },
        [showToast, userId]
    );

    const beginSession = useCallback(() => {
        const startedAt = new Date();
        const nextSession = { ...sessionRef.current, startedAt };
        const runStartedAt = Date.now();
        sessionRef.current = nextSession;
        statusRef.current = "running";
        runStartedAtRef.current = runStartedAt;
        setSession(nextSession);
        setStatus("running");
        writeActiveStudySession(userId, {
            accumulatedSeconds: accumulatedSecondsRef.current,
            runStartedAt,
            session: nextSession,
            status: "running"
        });
    }, [userId]);

    const pauseSession = useCallback(() => {
        const nextElapsed = liveElapsed();
        accumulatedSecondsRef.current = nextElapsed;
        runStartedAtRef.current = null;
        statusRef.current = "paused";
        setElapsedSeconds(nextElapsed);
        setStatus("paused");
        writeActiveStudySession(userId, {
            accumulatedSeconds: nextElapsed,
            runStartedAt: null,
            session: sessionRef.current,
            status: "paused"
        });
    }, [liveElapsed, userId]);

    const resumeSession = useCallback(() => {
        const runStartedAt = Date.now();
        runStartedAtRef.current = runStartedAt;
        statusRef.current = "running";
        setStatus("running");
        writeActiveStudySession(userId, {
            accumulatedSeconds: accumulatedSecondsRef.current,
            runStartedAt,
            session: sessionRef.current,
            status: "running"
        });
    }, [userId]);

    const cancelSession = useCallback(() => {
        sessionRef.current = null;
        statusRef.current = "ready";
        accumulatedSecondsRef.current = 0;
        runStartedAtRef.current = null;
        setSession(null);
        setElapsedSeconds(0);
        setStatus("ready");
        clearActiveStudySession(userId);
    }, [userId]);

    const finishSession = useCallback(async () => {
        if (!session || !userId) return;
        const finalSeconds = liveElapsed();
        if (finalSeconds < MINIMUM_SESSION_SECONDS) {
            cancelSession();
            showToast({
                message: "Sessions under one minute are not saved or counted.",
                type: "warning"
            });
            return;
        }
        accumulatedSecondsRef.current = finalSeconds;
        setElapsedSeconds(finalSeconds);
        statusRef.current = "finishing";
        setStatus("finishing");
        writeActiveStudySession(userId, {
            accumulatedSeconds: finalSeconds,
            runStartedAt: null,
            session,
            status: "paused"
        });

        try {
            const saved = await completeStudySession(userId, {
                ...session,
                startedAt: session.startedAt || new Date(),
                durationSeconds: finalSeconds,
                actualMinutes: secondsToStudyMinutes(finalSeconds)
            });
            try {
                await recordStudySessionLearningMemory(userId, saved);
            } catch {
                // Session history remains authoritative if memory sync is unavailable.
            }
            window.dispatchEvent(
                new CustomEvent("study-session-completed", { detail: saved })
            );
            showToast({
                message: `Study session saved: ${saved.actualMinutes} minute${saved.actualMinutes === 1 ? "" : "s"}.`,
                type: "success"
            });
            cancelSession();
        } catch {
            statusRef.current = "paused";
            runStartedAtRef.current = null;
            setStatus("paused");
            writeActiveStudySession(userId, {
                accumulatedSeconds: finalSeconds,
                runStartedAt: null,
                session,
                status: "paused"
            });
            showToast({
                message: "The study session could not be saved.",
                type: "error"
            });
        }
    }, [cancelSession, liveElapsed, session, showToast, userId]);

    const value = useMemo(
        () => ({
            elapsedSeconds,
            session,
            startSession,
            status
        }),
        [elapsedSeconds, session, startSession, status]
    );

    return (
        <StudySessionContext.Provider value={value}>
            {children}
            <StudySessionModal
                elapsedSeconds={elapsedSeconds}
                onCancel={cancelSession}
                onFinish={finishSession}
                onPause={pauseSession}
                onResume={resumeSession}
                onStart={beginSession}
                session={session}
                status={status}
            />
        </StudySessionContext.Provider>
    );
}

export default StudySessionProvider;
