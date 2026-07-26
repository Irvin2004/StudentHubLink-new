"use strict";

function requireCallback(callback, name) {
    if (callback !== undefined && typeof callback !== "function") {
        throw new TypeError(`${name} must be a function.`);
    }

    return callback;
}

/**
 * Creates an IntersectionObserver with a visible fallback.
 *
 * @param {Function} callback
 * @param {IntersectionObserverInit} options
 * @param {Function} Observer
 * @returns {IntersectionObserver|object}
 */
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
            callback(
                [
                    {
                        target: element,
                        isIntersecting: true,
                        intersectionRatio: 1
                    }
                ],
                this
            );
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

/**
 * Observes a collection of elements with one shared observer.
 *
 * @param {Iterable<Element>} elements
 * @param {Function} callback
 * @param {IntersectionObserverInit} options
 * @returns {IntersectionObserver|object}
 */
export function observeElements(elements, callback, options = {}) {
    const observer = createIntersectionObserver(callback, options);

    [...elements].forEach((element) => observer.observe(element));
    return observer;
}

/**
 * Creates an observer that routes visible and hidden entries separately.
 *
 * @param {object} options
 * @param {Function} Observer
 * @returns {IntersectionObserver|object}
 */
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
