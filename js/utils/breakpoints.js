"use strict";

export const BREAKPOINTS = Object.freeze({
    MOBILE: 768,
    TABLET: 1024
});

export function isMobileViewport(viewportWidth = globalThis.innerWidth) {
    return Number(viewportWidth) < BREAKPOINTS.MOBILE;
}

export function isTabletViewport(viewportWidth = globalThis.innerWidth) {
    const width = Number(viewportWidth);

    return width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
}
