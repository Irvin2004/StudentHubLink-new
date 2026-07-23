"use strict";

const PLAYBACK_SPEEDS = Object.freeze([1, 1.5, 2]);
const SEEK_STEP_SECONDS = 5;
const players = new Set();
const playersByContainer = new WeakMap();
let voicePlayerId = 0;

function normalizeUrl(value) {
    const url = String(value || "").trim();

    if (!url) {
        throw new Error("Voice message URL is required.");
    }

    const baseUrl = globalThis.location?.href || "https://studenthub.local";
    const parsed = new URL(url, baseUrl);

    if (!["https:", "http:", "blob:"].includes(parsed.protocol)) {
        throw new Error("Voice message URL is invalid.");
    }

    return url;
}

function normalizeDuration(value) {
    const duration = Number(value);
    return Number.isFinite(duration) && duration >= 0 ? duration : 0;
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(
        0,
        Math.floor(normalizeDuration(milliseconds) / 1000)
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
    )}`;
}

function createElement(documentReference, tagName, options = {}) {
    const element = documentReference.createElement(tagName);

    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;

    Object.entries(options.attributes || {}).forEach(([name, value]) => {
        element.setAttribute(name, String(value));
    });

    return element;
}

const sharedAudioManager = (() => {
    let audio = null;
    let activePlayer = null;
    let pendingTime = 0;

    function emitToActive(method, ...args) {
        activePlayer?.[method]?.(...args);
    }

    function handleTimeUpdate() {
        emitToActive("handleTimeUpdate", audio.currentTime);
    }

    function handleMetadata() {
        if (pendingTime > 0 && Number.isFinite(audio.duration)) {
            audio.currentTime = Math.min(pendingTime, audio.duration);
        }

        pendingTime = 0;
        emitToActive("handleMetadata", audio.duration);
    }

    function handleEnded() {
        audio.currentTime = 0;
        emitToActive("handleEnded");
    }

    function handleError() {
        emitToActive(
            "handleError",
            audio.error || new Error("Unable to play audio.")
        );
    }

    function getAudio() {
        if (audio) return audio;

        if (typeof Audio !== "function") {
            throw new Error("Audio playback is not supported by this browser.");
        }

        audio = new Audio();
        audio.preload = "metadata";
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleMetadata);
        audio.addEventListener("durationchange", handleMetadata);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
        return audio;
    }

    function select(player) {
        const playerAudio = getAudio();

        if (activePlayer === player) return playerAudio;

        if (activePlayer) {
            playerAudio.pause();
            activePlayer.handlePaused();
        }

        activePlayer = player;
        pendingTime = player.getCurrentTimeSeconds();
        playerAudio.src = player.url;
        playerAudio.playbackRate = player.getPlaybackRate();
        playerAudio.load();
        return playerAudio;
    }

    async function play(player) {
        const playerAudio = select(player);
        playerAudio.playbackRate = player.getPlaybackRate();

        try {
            await playerAudio.play();
            player.handlePlaying();
        } catch (error) {
            player.handlePaused();
            player.handleError(error);
        }
    }

    function pause(player) {
        if (activePlayer !== player || !audio) return;
        audio.pause();
        player.handlePaused();
    }

    function stop(player) {
        if (activePlayer === player && audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        player.handleStopped();
    }

    function seek(player, seconds) {
        if (activePlayer === player && audio) {
            const duration = Number.isFinite(audio.duration)
                ? audio.duration
                : seconds;
            audio.currentTime = Math.max(0, Math.min(seconds, duration));
        }

        player.handleTimeUpdate(seconds);
    }

    function setPlaybackRate(player, rate) {
        if (activePlayer === player && audio) {
            audio.playbackRate = rate;
        }
    }

    function release(player) {
        if (activePlayer !== player || !audio) return;

        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        activePlayer = null;
        pendingTime = 0;
    }

    function destroy() {
        if (!audio) return;

        audio.pause();
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleMetadata);
        audio.removeEventListener("durationchange", handleMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        audio.removeAttribute("src");
        audio.load();
        audio = null;
        activePlayer = null;
        pendingTime = 0;
    }

    return Object.freeze({
        play,
        pause,
        stop,
        seek,
        setPlaybackRate,
        release,
        destroy
    });
})();

export function createVoicePlayer({
    url,
    duration = 0,
    container,
    onError = () => {},
    onMetadata = () => {}
} = {}) {
    if (!container?.replaceChildren) {
        throw new Error("Voice player container is required.");
    }

    const documentReference = container.ownerDocument || globalThis.document;

    if (!documentReference?.createElement) {
        throw new Error("Voice player document is unavailable.");
    }

    const cleanUrl = normalizeUrl(url);
    const reportError = typeof onError === "function" ? onError : () => {};
    const reportMetadata = typeof onMetadata === "function"
        ? onMetadata
        : () => {};
    let totalDurationMs = normalizeDuration(duration);
    let currentTimeMs = 0;
    let playbackRateIndex = 0;
    let playing = false;
    let destroyed = false;
    const instructionsId =
        `voice-player-instructions-${++voicePlayerId}`;

    playersByContainer.get(container)?.destroy();

    const root = createElement(documentReference, "div", {
        className: "voice-player",
        attributes: {
            role: "group",
            "aria-label": "Voice message player",
            "aria-describedby": instructionsId,
            tabindex: "0"
        }
    });
    const playButton = createElement(documentReference, "button", {
        className: "voice-player-play",
        text: "\u25b6",
        attributes: { type: "button", "aria-label": "Play voice message" }
    });
    const stopButton = createElement(documentReference, "button", {
        className: "voice-player-stop",
        text: "\u25a0",
        attributes: { type: "button", "aria-label": "Stop voice message" }
    });
    const progress = createElement(documentReference, "input", {
        className: "voice-player-progress",
        attributes: {
            type: "range",
            min: "0",
            max: String(totalDurationMs / 1000),
            step: "0.1",
            value: "0",
            "aria-label": "Seek voice message",
            "aria-valuetext": `00:00 of ${
                totalDurationMs > 0
                    ? formatDuration(totalDurationMs)
                    : "unknown duration"
            }`
        }
    });
    const time = createElement(documentReference, "span", {
        className: "voice-player-time",
        attributes: { "aria-live": "off" }
    });
    const currentTime = createElement(documentReference, "span", {
        className: "voice-player-current-time",
        text: "00:00"
    });
    const separator = createElement(documentReference, "span", {
        text: " / ",
        attributes: { "aria-hidden": "true" }
    });
    const totalTime = createElement(documentReference, "span", {
        className: "voice-player-duration",
        text: totalDurationMs > 0
            ? formatDuration(totalDurationMs)
            : "Loading..."
    });
    const speedButton = createElement(documentReference, "button", {
        className: "voice-player-speed",
        text: "1\u00d7",
        attributes: {
            type: "button",
            "aria-label": "Playback speed, 1 times"
        }
    });
    const instructions = createElement(documentReference, "span", {
        className: "visually-hidden",
        text:
            "Press Enter or Space to play or pause. " +
            "Use Left and Right Arrow keys to seek. " +
            "Press Escape to stop.",
        attributes: { id: instructionsId }
    });

    time.append(currentTime, separator, totalTime);
    root.append(
        playButton,
        stopButton,
        progress,
        time,
        speedButton,
        instructions
    );
    container.replaceChildren(root);

    function updatePlayButton() {
        playButton.textContent = playing ? "\u23f8" : "\u25b6";
        playButton.setAttribute(
            "aria-label",
            playing ? "Pause voice message" : "Play voice message"
        );
    }

    function updateProgress(milliseconds) {
        currentTimeMs = Math.max(
            0,
            Math.min(normalizeDuration(milliseconds), totalDurationMs || Infinity)
        );
        progress.value = String(currentTimeMs / 1000);
        progress.setAttribute(
            "aria-valuetext",
            `${formatDuration(currentTimeMs)} of ${
                totalDurationMs > 0
                    ? formatDuration(totalDurationMs)
                    : "unknown duration"
            }`
        );
        currentTime.textContent = formatDuration(currentTimeMs);
    }

    const player = {
        url: cleanUrl,
        getCurrentTimeSeconds: () => currentTimeMs / 1000,
        getPlaybackRate: () => PLAYBACK_SPEEDS[playbackRateIndex],
        handlePlaying() {
            if (destroyed) return;
            playing = true;
            updatePlayButton();
        },
        handlePaused() {
            if (destroyed) return;
            playing = false;
            updatePlayButton();
        },
        handleStopped() {
            if (destroyed) return;
            playing = false;
            updateProgress(0);
            updatePlayButton();
        },
        handleEnded() {
            this.handleStopped();
        },
        handleTimeUpdate(seconds) {
            if (!destroyed) updateProgress(seconds * 1000);
        },
        handleMetadata(seconds) {
            if (destroyed || !Number.isFinite(seconds) || seconds <= 0) return;

            totalDurationMs = seconds * 1000;
            progress.max = String(seconds);
            totalTime.textContent = formatDuration(totalDurationMs);
            updateProgress(currentTimeMs);
            reportMetadata(totalDurationMs);
        },
        handleError(error) {
            if (!destroyed) reportError(error);
        }
    };

    function togglePlayback() {
        if (playing) {
            sharedAudioManager.pause(player);
        } else {
            sharedAudioManager.play(player);
        }
    }

    function stopPlayback() {
        sharedAudioManager.stop(player);
    }

    function seekTo(seconds) {
        const safeSeconds = Math.max(
            0,
            Math.min(Number(seconds) || 0, totalDurationMs / 1000)
        );
        sharedAudioManager.seek(player, safeSeconds);
    }

    function handleSeek() {
        seekTo(progress.value);
    }

    function changePlaybackSpeed() {
        playbackRateIndex = (playbackRateIndex + 1) % PLAYBACK_SPEEDS.length;
        const rate = PLAYBACK_SPEEDS[playbackRateIndex];

        speedButton.textContent = `${rate}\u00d7`;
        speedButton.setAttribute(
            "aria-label",
            `Playback speed, ${rate} times`
        );
        sharedAudioManager.setPlaybackRate(player, rate);
    }

    function handleKeyboard(event) {
        if (event.target !== root) return;

        if (
            event.key === " " ||
            event.key === "Enter" ||
            event.code === "Space"
        ) {
            event.preventDefault();
            togglePlayback();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            seekTo((currentTimeMs / 1000) - SEEK_STEP_SECONDS);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            seekTo((currentTimeMs / 1000) + SEEK_STEP_SECONDS);
        } else if (event.key === "Escape") {
            event.preventDefault();
            stopPlayback();
        }
    }

    playButton.addEventListener("click", togglePlayback);
    stopButton.addEventListener("click", stopPlayback);
    progress.addEventListener("input", handleSeek);
    speedButton.addEventListener("click", changePlaybackSpeed);
    root.addEventListener("keydown", handleKeyboard);

    const controller = Object.freeze({
        element: root,
        play: () => sharedAudioManager.play(player),
        pause: () => sharedAudioManager.pause(player),
        stop: stopPlayback,
        destroy() {
            if (destroyed) return;
            destroyed = true;

            sharedAudioManager.release(player);
            playButton.removeEventListener("click", togglePlayback);
            stopButton.removeEventListener("click", stopPlayback);
            progress.removeEventListener("input", handleSeek);
            speedButton.removeEventListener("click", changePlaybackSpeed);
            root.removeEventListener("keydown", handleKeyboard);
            players.delete(controller);
            playersByContainer.delete(container);
            container.replaceChildren();
        }
    });

    players.add(controller);
    playersByContainer.set(container, controller);
    return controller;
}

export function destroyVoicePlayer() {
    [...players].forEach((player) => player.destroy());
    sharedAudioManager.destroy();
}
