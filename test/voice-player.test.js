import test from "node:test";
import assert from "node:assert/strict";

import {
    createVoicePlayer,
    destroyVoicePlayer
} from "../js/components/voice-player.js";

class FakeElement {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName;
        this.ownerDocument = ownerDocument;
        this.children = [];
        this.listeners = new Map();
        this.attributes = new Map();
        this.className = "";
        this.textContent = "";
        this.value = "";
        this.max = "";
    }

    setAttribute(name, value) {
        this.attributes.set(name, value);
        this[name] = value;
    }

    addEventListener(type, callback) {
        this.listeners.set(type, callback);
    }

    removeEventListener(type, callback) {
        if (this.listeners.get(type) === callback) {
            this.listeners.delete(type);
        }
    }

    append(...children) {
        this.children.push(...children);
    }

    replaceChildren(...children) {
        this.children = children;
    }

    dispatch(type, properties = {}) {
        this.listeners.get(type)?.({
            target: this,
            key: "",
            code: "",
            preventDefault() {},
            ...properties
        });
    }
}

class FakeDocument {
    createElement(tagName) {
        return new FakeElement(tagName, this);
    }
}

class FakeAudio {
    static instances = [];

    constructor() {
        this.listeners = new Map();
        this.currentTime = 0;
        this.duration = 25;
        this.playbackRate = 1;
        this.src = "";
        this.paused = true;
        FakeAudio.instances.push(this);
    }

    addEventListener(type, callback) {
        this.listeners.set(type, callback);
    }

    removeEventListener(type, callback) {
        if (this.listeners.get(type) === callback) {
            this.listeners.delete(type);
        }
    }

    load() {
        if (this.src) this.dispatch("loadedmetadata");
    }

    async play() {
        this.paused = false;
    }

    pause() {
        this.paused = true;
    }

    removeAttribute(name) {
        if (name === "src") this.src = "";
    }

    dispatch(type) {
        this.listeners.get(type)?.();
    }
}

test("voice players share audio and support playback controls", async () => {
    const OriginalAudio = globalThis.Audio;
    globalThis.Audio = FakeAudio;
    FakeAudio.instances = [];

    try {
        const documentReference = new FakeDocument();
        const firstContainer = new FakeElement("div", documentReference);
        const secondContainer = new FakeElement("div", documentReference);
        const first = createVoicePlayer({
            url: "https://example.test/first.webm",
            duration: 25000,
            container: firstContainer
        });
        const second = createVoicePlayer({
            url: "https://example.test/second.webm",
            duration: 25000,
            container: secondContainer
        });

        await first.play();

        const audio = FakeAudio.instances[0];
        const firstRoot = first.element;
        const firstProgress = firstRoot.children[2];

        assert.equal(FakeAudio.instances.length, 1);
        assert.equal(firstRoot.children[0].textContent, "\u23f8");

        audio.currentTime = 8;
        audio.dispatch("timeupdate");
        assert.equal(
            firstRoot.children[3].children[0].textContent,
            "00:08"
        );

        firstProgress.value = "12";
        firstProgress.dispatch("input");
        assert.equal(audio.currentTime, 12);

        firstRoot.children[4].dispatch("click");
        assert.equal(audio.playbackRate, 1.5);
        assert.equal(firstRoot.children[4].textContent, "1.5\u00d7");

        await second.play();
        assert.equal(FakeAudio.instances.length, 1);
        assert.equal(firstRoot.children[0].textContent, "\u25b6");
        assert.equal(second.element.children[0].textContent, "\u23f8");

        second.element.dispatch("keydown", {
            target: second.element,
            key: "ArrowRight"
        });
        assert.equal(audio.currentTime, 5);

        second.stop();
        assert.equal(audio.currentTime, 0);
        assert.equal(second.element.children[0].textContent, "\u25b6");

        destroyVoicePlayer();
        assert.equal(audio.src, "");
        assert.equal(firstContainer.children.length, 0);
        assert.equal(secondContainer.children.length, 0);
    } finally {
        destroyVoicePlayer();
        globalThis.Audio = OriginalAudio;
    }
});

test("voice player reports playback failures through its callback", async () => {
    const OriginalAudio = globalThis.Audio;

    class FailingAudio extends FakeAudio {
        async play() {
            throw new Error("Playback blocked");
        }
    }

    globalThis.Audio = FailingAudio;

    try {
        const documentReference = new FakeDocument();
        const container = new FakeElement("div", documentReference);
        const errors = [];
        const player = createVoicePlayer({
            url: "https://example.test/voice.webm",
            duration: 1000,
            container,
            onError: (error) => errors.push(error.message)
        });

        await player.play();
        assert.deepEqual(errors, ["Playback blocked"]);
    } finally {
        destroyVoicePlayer();
        globalThis.Audio = OriginalAudio;
    }
});
