import { useContext } from "react";

import { NetworkContext } from "../context/network-context.js";

export function useNetwork() {
    const context = useContext(NetworkContext);

    if (!context) {
        throw new Error("useNetwork must be used within NetworkProvider.");
    }

    return context;
}
