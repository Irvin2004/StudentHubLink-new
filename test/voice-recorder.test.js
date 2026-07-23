import test from "node:test";
import assert from "node:assert/strict";

import {
    createVoiceRecorder,
    destroy
} from "../js/components/voice-recorder.js";

class FakeMediaRecorder {
    static isTypeSupported(type) {
        return type === "audio/webm";
    }

    constructor(stream, options = {}) {
        this.stream = stream;
        this.mimeType = options.mimeType || "audio/webm";
        this.state = "inactive";
        this.listeners = new Map();
    }

    addEventListener(type, callback) {
        this.listeners.set(type, callback);
    }

    start() {
        this.state = "recording";
    }

    stop() {
        this.state = "inactive";
        this.listeners.get("dataavailable")?.({
            data: new Blob(["voice"], { type: this.mimeType })
        });
        this.listeners.get("stop")?.();
    }
}

function createMediaStream() {
    const track = {
        stopped: false,
        stop() {
            this.stopped = true;
        }
    };

    return {
        track,
        stream: {
            getTracks() {
                return [track];
            }
        }
    };
}

test("voice recorder returns a blob, duration, and MIME type", async () => {
    const { track, stream } = createMediaStream();
    let elapsed = 1000;
    const states = [];
    const recorder = createVoiceRecorder({
        mediaDevices: {
            async getUserMedia(constraints) {
                assert.deepEqual(constraints, { audio: true });
                return stream;
            }
        },
        MediaRecorder: FakeMediaRecorder,
        now: () => elapsed,
        setInterval: () => 1,
        clearInterval: () => {},
        onStateChange: ({ state }) => states.push(state)
    });

    await recorder.startRecording();
    elapsed = 3300;
    const result = await recorder.stopRecording();

    assert.equal(result.blob instanceof Blob, true);
    assert.equal(result.blob.size > 0, true);
    assert.equal(result.duration, 2300);
    assert.equal(result.mimeType, "audio/webm");
    assert.equal(track.stopped, true);
    assert.deepEqual(states, ["recording", "stopped"]);
});

test("voice recorder cancellation discards the blob", async () => {
    const { track, stream } = createMediaStream();
    const recorder = createVoiceRecorder({
        mediaDevices: { getUserMedia: async () => stream },
        MediaRecorder: FakeMediaRecorder,
        now: () => 1000,
        setInterval: () => 1,
        clearInterval: () => {}
    });

    await recorder.startRecording();

    assert.equal(await recorder.cancelRecording(), null);
    assert.equal(track.stopped, true);
});

test("voice recorder exposes microphone permission failures", async () => {
    const denied = new Error("Permission denied");
    const recorder = createVoiceRecorder({
        mediaDevices: {
            getUserMedia: async () => {
                throw denied;
            }
        },
        MediaRecorder: FakeMediaRecorder
    });

    await assert.rejects(recorder.startRecording(), (error) =>
        Boolean(
            error.message ===
                "Microphone access is required to send voice messages." &&
            error.cause === denied
        )
    );

    destroy();
});
