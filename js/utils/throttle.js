"use strict";

/**
 * Limits a callback to one leading and one trailing call per interval.
 *
 * @param {Function} callback
 * @param {number} interval
 * @returns {Function & {cancel: Function, flush: Function}}
 */
export function throttle(callback, interval = 250) {
    if (typeof callback !== "function") {
        throw new TypeError("Throttle callback must be a function.");
    }

    const wait = Math.max(0, Number(interval) || 0);
    let lastInvocation = 0;
    let timer = null;
    let latestArguments = null;
    let latestContext = null;

    function invoke(timestamp = Date.now()) {
        const argumentsToUse = latestArguments;
        const contextToUse = latestContext;

        clearTimeout(timer);
        lastInvocation = timestamp;
        timer = null;
        latestArguments = null;
        latestContext = null;

        return callback.apply(contextToUse, argumentsToUse);
    }

    function throttled(...args) {
        const now = Date.now();
        const remaining = wait - (now - lastInvocation);

        latestArguments = args;
        latestContext = this;

        if (remaining <= 0 || remaining > wait) {
            clearTimeout(timer);
            return invoke(now);
        }

        if (!timer) {
            timer = setTimeout(invoke, remaining);
        }
    }

    throttled.cancel = () => {
        clearTimeout(timer);
        timer = null;
        latestArguments = null;
        latestContext = null;
        lastInvocation = 0;
    };

    throttled.flush = () => (timer ? invoke() : undefined);

    return throttled;
}
