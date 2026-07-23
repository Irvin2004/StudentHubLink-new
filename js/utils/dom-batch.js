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

/**
 * Creates a document fragment for batched DOM insertion.
 *
 * @param {Document} documentReference
 * @returns {DocumentFragment}
 */
export function createFragment(
    documentReference = globalThis.document
) {
    return requireDocument(
        documentReference
    ).createDocumentFragment();
}

/**
 * Appends a prepared fragment to a container in one operation.
 *
 * @param {Element} container
 * @param {DocumentFragment} fragment
 * @returns {Element}
 */
export function appendFragment(container, fragment) {
    const target = requireContainer(container);

    if (!fragment) {
        throw new TypeError("A document fragment is required.");
    }

    target.appendChild(fragment);
    return target;
}

/**
 * Appends an iterable of nodes through one document fragment.
 *
 * @param {Element} container
 * @param {Iterable<Node>} nodes
 * @param {Document} documentReference
 * @returns {Element}
 */
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
