import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
    getUserFriendlyErrorMessage,
    normalizeError
} from "../js/services/error-service.js";
import {
    ERROR_TYPES
} from "../js/config/error-types.js";
import {
    AppError
} from "../js/models/app-error.js";
import {
    createSkeleton
} from "../js/components/skeleton.js";
import {
    SKELETON_TYPES
} from "../js/config/skeleton-types.js";
import { debounce } from "../js/utils/debounce.js";
import {
    createIntersectionObserver,
    createObserver
} from "../js/utils/intersection-observer.js";
import {
    appendFragment,
    appendNodes,
    createFragment
} from "../js/utils/dom-batch.js";
import {
    cancelScheduledFrames,
    scheduleFrame
} from "../js/utils/raf.js";
import { throttle } from "../js/utils/throttle.js";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

test("error service normalizes every supported notice type", () => {
    Object.values(ERROR_TYPES).forEach((type) => {
        const notice = normalizeError({ type, message: "Saved." });

        assert.equal(notice.type, type);
        assert.ok(notice.title);
        assert.ok(Object.isFrozen(notice));
    });

    assert.equal(
        getUserFriendlyErrorMessage({ code: "permission-denied" }),
        "You don't have permission to perform this action."
    );
});

test("error service stays DOM-free and toast component owns rendering", () => {
    const service = read("js/services/error-service.js");
    const component = read("js/components/toast.js");
    const styles = read("css/components/toast.css");

    assert.doesNotMatch(
        service,
        /globalThis\.document|window\.|innerHTML|createElement|firebasejs/i
    );
    assert.match(component, /export function createToast/);
    assert.match(component, /createElement/);
    assert.match(component, /aria-live/);
    assert.match(component, /DEFAULT_DURATIONS/);
    assert.match(component, /\[ERROR_TYPES\.SUCCESS\]: 3000/);
    assert.match(component, /\[ERROR_TYPES\.INFO\]: 4000/);
    assert.match(component, /\[ERROR_TYPES\.WARNING\]: 5000/);
    assert.match(component, /\[ERROR_TYPES\.ERROR\]: 6000/);
    assert.match(styles, /\.toast--success/);
    assert.match(styles, /\.toast--warning/);
    assert.match(styles, /\.toast--info/);
    assert.match(styles, /\.toast--error/);

    [
        "showError",
        "showWarning",
        "showSuccess",
        "showInfo",
        "logError",
        "handleError"
    ].forEach((apiName) => {
        assert.match(
            service,
            new RegExp(`export function ${apiName}\\(`)
        );
    });
});

test("AppError preserves safe structured error metadata", () => {
    const timestamp = Date.now();
    const error = new AppError({
        title: "Upload Failed",
        message: "Unable to upload file.",
        code: "UPLOAD_ERROR",
        timestamp
    });

    assert.equal(error.name, "AppError");
    assert.deepEqual(error.toJSON(), {
        title: "Upload Failed",
        message: "Unable to upload file.",
        type: ERROR_TYPES.ERROR,
        code: "UPLOAD_ERROR",
        timestamp
    });
});

test("skeleton loader exposes accessible list and message variants", () => {
    const list = createSkeleton(SKELETON_TYPES.USER, { count: 2 });
    const messages = createSkeleton(
        SKELETON_TYPES.MESSAGE,
        { count: 2 }
    );

    assert.match(list, /aria-hidden="true"/);
    assert.match(list, /data-skeleton-type="user"/);
    assert.equal((list.match(/skeleton__avatar/g) || []).length, 2);
    assert.equal(
        (messages.match(/skeleton-message(?: |")/g) || []).length,
        2
    );
});

test("debounce coalesces calls and supports cancellation", async () => {
    const values = [];
    const collect = debounce((value) => values.push(value), 10);

    collect("first");
    collect("last");
    await wait(20);
    assert.deepEqual(values, ["last"]);

    collect("cancelled");
    collect.cancel();
    await wait(20);
    assert.deepEqual(values, ["last"]);

    collect("flushed");
    collect.flush();
    await wait(20);
    assert.deepEqual(values, ["last", "flushed"]);
});

test("throttle limits bursts and retains the latest trailing value", async () => {
    const values = [];
    const collect = throttle((value) => values.push(value), 15);

    collect("first");
    collect("middle");
    collect("last");
    await wait(25);

    assert.deepEqual(values, ["first", "last"]);
    collect.cancel();
});

test("intersection observer fallback reports elements as visible", () => {
    const entries = [];
    const observer = createIntersectionObserver(
        (nextEntries) => entries.push(...nextEntries),
        {},
        null
    );
    const element = { id: "sentinel" };

    observer.observe(element);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].target, element);
    assert.equal(entries[0].intersectionRatio, 1);
    observer.disconnect();
});

test("observer wrapper routes enter and exit callbacks", () => {
    const calls = [];
    let nativeCallback;
    let nativeOptions;

    class ObserverStub {
        constructor(callback, options) {
            nativeCallback = callback;
            nativeOptions = options;
        }
    }

    const observer = createObserver(
        {
            root: "feed",
            threshold: 0.5,
            onEnter: (target) => calls.push(`enter:${target.id}`),
            onExit: (target) => calls.push(`exit:${target.id}`)
        },
        ObserverStub
    );

    nativeCallback(
        [
            { target: { id: "first" }, isIntersecting: true },
            { target: { id: "second" }, isIntersecting: false }
        ],
        observer
    );

    assert.deepEqual(calls, ["enter:first", "exit:second"]);
    assert.deepEqual(nativeOptions, {
        root: "feed",
        rootMargin: "0px",
        threshold: 0.5
    });
});

test("frame helper batches callbacks and supports cancellation", async () => {
    const values = [];
    const cancel = scheduleFrame(() => values.push("cancelled"));

    cancel();
    scheduleFrame(() => values.push("first"));
    scheduleFrame(() => values.push("second"));

    await wait(30);
    assert.deepEqual(values, ["first", "second"]);
    cancelScheduledFrames();

    const documentDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        "document"
    );

    Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: {
            documentElement: {
                dataset: {
                    reducedMotion: "true"
                }
            }
        }
    });

    scheduleFrame(() => values.push("immediate"));
    assert.deepEqual(values, ["first", "second", "immediate"]);

    if (documentDescriptor) {
        Object.defineProperty(
            globalThis,
            "document",
            documentDescriptor
        );
    } else {
        delete globalThis.document;
    }
});

test("DOM batch helpers append one fragment per render", () => {
    const appended = [];
    const createDocument = {
        createDocumentFragment() {
            return {
                children: [],
                appendChild(node) {
                    this.children.push(node);
                }
            };
        }
    };
    const container = {
        ownerDocument: createDocument,
        appendChild(fragment) {
            appended.push(fragment);
        }
    };

    const fragment = createFragment(createDocument);
    appendFragment(container, fragment);
    appendNodes(container, [{ id: 1 }, { id: 2 }]);

    assert.equal(appended.length, 2);
    assert.deepEqual(
        appended[1].children.map((node) => node.id),
        [1, 2]
    );
});
