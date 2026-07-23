"use strict";

import {
    createVoicePlayer,
    destroyVoicePlayer
} from "../components/voice-player.js?voice=1";

const renderers = new Set();
const renderersByContainer = new WeakMap();

function normalizeDuration(value) {
    const duration = Number(value);
    return Number.isFinite(duration) && duration >= 0 ? duration : 0;
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(normalizeDuration(milliseconds) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
    )}`;
}

function destroyRenderer(renderer) {
    if (!renderer || renderer.destroyed) return;

    renderer.destroyed = true;
    renderer.player?.destroy();
    renderer.container.replaceChildren();
    renderers.delete(renderer);
    renderersByContainer.delete(renderer.container);
}

export function renderVoiceMessage({
    message,
    container,
    currentUserId
} = {}) {
    if (!container?.replaceChildren) {
        throw new Error("Voice message container is required.");
    }

    const documentReference = container.ownerDocument || globalThis.document;

    if (!documentReference?.createElement) {
        throw new Error("Voice message document is unavailable.");
    }

    renderersByContainer.get(container)?.destroy();

    const voice = message?.voice || {};
    const duration = normalizeDuration(voice.duration);
    const wrapper = documentReference.createElement("div");
    const playerContainer = documentReference.createElement("div");
    const metadata = documentReference.createElement("p");
    const renderer = {
        container,
        player: null,
        destroyed: false,
        destroy() {
            destroyRenderer(renderer);
        }
    };

    wrapper.className = [
        "voice-message",
        message?.senderId === currentUserId
            ? "voice-message--outgoing"
            : "voice-message--incoming"
    ].join(" ");
    wrapper.dataset.messageId = String(message?.id || "");
    playerContainer.className = "voice-message__player";
    metadata.className = duration > 0
        ? "voice-message__duration"
        : "voice-message__loading";
    metadata.setAttribute("role", "status");
    metadata.setAttribute("aria-live", "polite");
    metadata.textContent = duration > 0
        ? `Voice message, ${formatDuration(duration)}`
        : "Loading audio...";

    wrapper.append(playerContainer, metadata);
    container.replaceChildren(wrapper);
    renderers.add(renderer);
    renderersByContainer.set(container, renderer);

    try {
        renderer.player = createVoicePlayer({
            url: voice.url || message?.fileUrl,
            duration,
            container: playerContainer,
            onMetadata(loadedDuration) {
                if (renderer.destroyed) return;

                metadata.className = "voice-message__duration";
                metadata.textContent =
                    `Voice message, ${formatDuration(loadedDuration)}`;
            },
            onError() {
                if (renderer.destroyed) return;

                metadata.className = "voice-message__error";
                metadata.textContent = "\u26a0 Unable to load audio";
            }
        });
    } catch {
        metadata.className = "voice-message__error";
        metadata.textContent = "\u26a0 Unable to load audio";
    }

    return wrapper;
}

export function destroyVoiceMessage(container) {
    if (container) {
        destroyRenderer(renderersByContainer.get(container));
        return;
    }

    [...renderers].forEach(destroyRenderer);
    destroyVoicePlayer();
}
