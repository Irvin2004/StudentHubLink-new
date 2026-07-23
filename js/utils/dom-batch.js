"use strict";

function requireDocument(documentReference) {
    if (
        !documentReference ||
        typeof documentReference.createDocumentFragment !== "function"
    ) {
        throw new TypeError(
            "A document with createDocumentFragment() is required."
        );
    }

    return documentReference;
}

function requireContainer(container) {
    if (!container || typeof container.appendChild !== "function") {
        throw new TypeError(
            "A container with appendChild() is required."
        );
    }

    return container;
}

export function createFragment(
    documentReference = globalThis.document
) {
    return requireDocument(
        documentReference
    ).createDocumentFragment();
}

export function appendFragment(container, fragment) {
    const target = requireContainer(container);

    if (!fragment) {
        throw new TypeError("A document fragment is required.");
    }

    target.appendChild(fragment);
    return target;
}

export function appendNodes(
    container,
    nodes,
    documentReference = container?.ownerDocument || globalThis.document
) {
    const fragment = createFragment(documentReference);

    for (const node of nodes || []) {
        fragment.appendChild(node);
    }

    return appendFragment(container, fragment);
}
