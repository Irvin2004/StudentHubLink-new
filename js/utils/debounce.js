"use strict";

export function debounce(callback, delay = 250) {
    if (typeof callback !== "function") {
        throw new TypeError("Debounce callback must be a function.");
    }

    const wait = Math.max(0, Number(delay) || 0);
    let timer = null;
    let latestArguments = null;
    let latestContext = null;

    function invoke() {
        const argumentsToUse = latestArguments;
        const contextToUse = latestContext;

        clearTimeout(timer);
        timer = null;
        latestArguments = null;
        latestContext = null;

        return callback.apply(contextToUse, argumentsToUse);
    }

    function debounced(...args) {
        latestArguments = args;
        latestContext = this;
        clearTimeout(timer);
        timer = setTimeout(invoke, wait);
    }

    debounced.cancel = () => {
        clearTimeout(timer);
        timer = null;
        latestArguments = null;
        latestContext = null;
    };

    debounced.flush = () => (
        timer ? invoke() : undefined
    );

    debounced.pending = () => timer !== null;

    return debounced;
}
