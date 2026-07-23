export const BREAKPOINTS = Object.freeze({
    MOBILE: 768,
    TABLET: 1024
});

export const MEDIA_QUERIES = Object.freeze({
    MOBILE: `(max-width: ${BREAKPOINTS.MOBILE - 1}px)`,
    TABLET: `(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${
        BREAKPOINTS.TABLET - 1
    }px)`,
    DESKTOP: `(min-width: ${BREAKPOINTS.TABLET}px)`
});
