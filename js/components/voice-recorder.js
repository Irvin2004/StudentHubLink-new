"use strict";

const PREFERRED_MIME_TYPES = Object.freeze([
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
]);

function createRecorderInstance(options = {}) {
    const mediaDevices =
        options.mediaDevices || globalThis.navigator?.mediaDevices;
    const MediaRecorderClass =
        options.MediaRecorder || globalThis.MediaRecorder;
    const now =
        typeof options.now === "function"
            ? options.now
            : () => globalThis.performance?.now?.() ?? Date.now();
    const setTimer = options.setInterval || globalThis.setInterval;
    const clearTimer = options.clearInterval || globalThis.clearInterval;
    const onTick =
        typeof options.onTick === "function" ? options.onTick : () => {};
    const onStateChange =
        typeof options.onStateChange === "function"
            ? options.onStateChange
            : () => {};

    let recorder = null;
    let stream = null;
    let chunks = [];
    let startedAt = 0;
    let timer = null;
    let stopResolve = null;
    let stopReject = null;
    let cancelled = false;
    let destroyed = false;

    function selectMimeType() {
        if (typeof MediaRecorderClass?.isTypeSupported !== "function") {
            return "";
        }

        return (
            PREFERRED_MIME_TYPES.find((type) =>
                MediaRecorderClass.isTypeSupported(type)
            ) || ""
        );
    }

    function getDuration() {
        return Math.max(0, Math.round(now() - startedAt));
    }

    function stopTracks() {
        stream?.getTracks?.().forEach((track) => track.stop());
        stream = null;
    }

    function stopTimer() {
        if (timer !== null) {
            clearTimer(timer);
            timer = null;
        }
    }

    function resetRecording() {
        stopTimer();
        stopTracks();
        recorder = null;
        chunks = [];
        startedAt = 0;
        cancelled = false;
    }

    function handleData(event) {
        if (event.data?.size > 0) {
            chunks.push(event.data);
        }
    }

    function handleStop() {
        const duration = getDuration();
        const mimeType = recorder?.mimeType || chunks[0]?.type || "audio/webm";
        const result = cancelled
            ? null
            : {
                  blob: new Blob(chunks, { type: mimeType }),
                  duration,
                  mimeType
              };
        const resolve = stopResolve;

        stopResolve = null;
        stopReject = null;
        resetRecording();
        onStateChange({
            state: result ? "stopped" : "cancelled",
            duration
        });
        resolve?.(result);
    }

    function handleError(event) {
        const reject = stopReject;
        const error = event?.error || new Error("Audio recording failed.");

        stopResolve = null;
        stopReject = null;
        resetRecording();
        onStateChange({ state: "error", duration: 0, error });
        reject?.(error);
    }

    async function startRecording() {
        if (destroyed) {
            throw new Error("Voice recorder has been destroyed.");
        }

        if (recorder?.state === "recording") {
            throw new Error("Audio recording is already in progress.");
        }

        if (!mediaDevices?.getUserMedia || !MediaRecorderClass) {
            throw new Error(
                "Audio recording is not supported by this browser."
            );
        }

        try {
            stream = await mediaDevices.getUserMedia({ audio: true });
        } catch (cause) {
            const error = new Error(
                "Microphone access is required to send voice messages."
            );
            error.cause = cause;
            throw error;
        }

        const mimeType = selectMimeType();

        try {
            recorder = mimeType
                ? new MediaRecorderClass(stream, { mimeType })
                : new MediaRecorderClass(stream);
        } catch (error) {
            stopTracks();
            throw error;
        }

        chunks = [];
        cancelled = false;
        recorder.addEventListener("dataavailable", handleData);
        recorder.addEventListener("stop", handleStop, { once: true });
        recorder.addEventListener("error", handleError, { once: true });
        startedAt = now();
        recorder.start();
        onTick(0);
        timer = setTimer(() => onTick(getDuration()), 250);
        onStateChange({ state: "recording", duration: 0 });
    }

    function finishRecording(shouldCancel) {
        if (!recorder || recorder.state !== "recording") {
            return Promise.reject(
                new Error("No audio recording is in progress.")
            );
        }

        cancelled = shouldCancel;
        stopTimer();

        return new Promise((resolve, reject) => {
            stopResolve = resolve;
            stopReject = reject;
            recorder.stop();
        });
    }

    function stopRecording() {
        return finishRecording(false);
    }

    function cancelRecording() {
        return finishRecording(true);
    }

    function destroy() {
        if (destroyed) return;
        destroyed = true;

        if (recorder?.state === "recording") {
            cancelled = true;
            recorder.stop();
        } else {
            resetRecording();
        }
    }

    return Object.freeze({
        startRecording,
        stopRecording,
        cancelRecording,
        destroy
    });
}

let activeVoiceRecorder = null;

function requireRecorder() {
    if (!activeVoiceRecorder) {
        throw new Error("Create the voice recorder before using it.");
    }

    return activeVoiceRecorder;
}

export function createVoiceRecorder(options = {}) {
    activeVoiceRecorder?.destroy();
    activeVoiceRecorder = createRecorderInstance(options);
    return activeVoiceRecorder;
}

export function startRecording() {
    return requireRecorder().startRecording();
}

export function stopRecording() {
    return requireRecorder().stopRecording();
}

export function cancelRecording() {
    return requireRecorder().cancelRecording();
}

export function destroy() {
    activeVoiceRecorder?.destroy();
    activeVoiceRecorder = null;
}
