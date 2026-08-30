import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function splitFirebasePackages(id) {
    if (!id.includes("node_modules")) {
        return undefined;
    }

    if (id.includes("@firebase/firestore")) {
        return "firebase-firestore";
    }

    if (id.includes("@firebase/auth")) {
        return "firebase-auth";
    }

    if (id.includes("@firebase/storage")) {
        return "firebase-storage";
    }

    if (id.includes("@firebase/") || id.includes("/firebase/")) {
        return "firebase-core";
    }

    return undefined;
}

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(process.cwd(), "src")
        }
    },
    build: {
        emptyOutDir: true,
        outDir: "dist",
        rollupOptions: {
            output: {
                manualChunks: splitFirebasePackages
            }
        }
    },
    preview: {
        host: "127.0.0.1",
        port: 4173
    },
    server: {
        host: "127.0.0.1",
        port: 5173,
        strictPort: true
    }
});
