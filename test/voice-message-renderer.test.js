import test from "node:test";
import assert from "node:assert/strict";

import {
    destroyVoiceMessage,
    renderVoiceMessage
} from "../js/renderers/voice-message-renderer.js";

class FakeElement {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName;
        this.ownerDocument = ownerDocument;
        this.children = [];
        this.listeners = new Map();
        this.attributes = new Map();
        this.dataset = {};
        this.className = "";
        this.textContent = "";
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
}

class FakeDocument {
    createElement(tagName) {
        return new FakeElement(tagName, this);
    }
}

function createContainer() {
    const documentReference = new FakeDocument();
    return new FakeElement("div", documentReference);
}

test("voice renderer creates an aligned player with duration metadata", () => {
    const container = createContainer();
    const wrapper = renderVoiceMessage({
        message: {
            id: "message-1",
            senderId: "user-1",
            type: "voice",
            voice: {
                url: "https://example.test/voice.webm",
                duration: 18000,
                mimeType: "audio/webm",
                size: 100
            }
        },
        container,
        currentUserId: "user-1"
    });

    assert.match(wrapper.className, /voice-message--outgoing/);
    assert.equal(wrapper.dataset.messageId, "message-1");
    assert.equal(wrapper.children[1].textContent, "Voice message, 00:18");
    assert.equal(wrapper.children[1].className, "voice-message__duration");
    assert.equal(wrapper.children[0].children[0].className, "voice-player");

    destroyVoiceMessage();
    assert.equal(container.children.length, 0);
});

test("voice renderer shows loading and invalid-audio states", () => {
    const loadingContainer = createContainer();
    const loading = renderVoiceMessage({
        message: {
            id: "message-2",
            senderId: "user-2",
            voice: {
                url: "https://example.test/loading.webm",
                duration: 0
            }
        },
        container: loadingContainer,
        currentUserId: "user-1"
    });

    assert.match(loading.className, /voice-message--incoming/);
    assert.equal(loading.children[1].className, "voice-message__loading");
    assert.equal(loading.children[1].textContent, "Loading audio...");

    const errorContainer = createContainer();
    const invalid = renderVoiceMessage({
        message: {
            id: "message-3",
            senderId: "user-2",
            voice: { url: "javascript:alert(1)", duration: 1000 }
        },
        container: errorContainer,
        currentUserId: "user-1"
    });

    assert.equal(invalid.children[1].className, "voice-message__error");
    assert.equal(
        invalid.children[1].textContent,
        "\u26a0 Unable to load audio"
    );

    destroyVoiceMessage();
});
