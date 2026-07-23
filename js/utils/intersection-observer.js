"use strict";

function requireCallback(callback, name) {
    if (callback !== undefined && typeof callback !== "function") {
        throw new TypeError(`${name} must be a function.`);
    }

    return callback;
}

export function createIntersectionObserver(
    callback,
    options = {},
    Observer = globalThis.IntersectionObserver
) {
    if (typeof callback !== "function") {
        throw new TypeError(
            "Intersection observer callback must be a function."
        );
    }

    if (typeof Observer === "function") {
        return new Observer(callback, options);
    }

    const observedElements = new Set();

    return {
        observe(element) {
            if (!element || observedElements.has(element)) return;

            observedElements.add(element);
            callback([{
                target: element,
                isIntersecting: true,
                intersectionRatio: 1
            }], this);
        },
        unobserve(element) {
            observedElements.delete(element);
        },
        disconnect() {
            observedElements.clear();
        },
        takeRecords() {
            return [];
        }
    };
}

export function observeElements(
    elements,
    callback,
    options = {}
) {
    const observer = createIntersectionObserver(callback, options);

    [...elements].forEach((element) => observer.observe(element));
    return observer;
}

export function createObserver(
    {
        root = null,
        rootMargin = "0px",
        threshold = 0,
        onEnter = () => {},
        onExit = () => {}
    } = {},
    Observer = globalThis.IntersectionObserver
) {
    const handleEnter = requireCallback(onEnter, "onEnter");
    const handleExit = requireCallback(onExit, "onExit");

    return createIntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    handleEnter(entry.target, entry, observer);
                    return;
                }

                handleExit(entry.target, entry, observer);
            });
        },
        {
            root,
            rootMargin,
            threshold
        },
        Observer
    );
}
