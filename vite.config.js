import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const IGNORED_DIRECTORIES = new Set([
    ".firebase",
    ".git",
    "coverage",
    "dist",
    "functions",
    "node_modules",
    "playwright-report",
    "test-results"
]);

function findHtmlEntries(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
            return [];
        }

        const entryPath = resolve(directory, entry.name);

        if (entry.isDirectory()) {
            return findHtmlEntries(entryPath);
        }

        return entry.isFile() && entry.name.endsWith(".html")
            ? [entryPath]
            : [];
    });
}

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
    build: {
        emptyOutDir: true,
        outDir: "dist",
        rollupOptions: {
            input: findHtmlEntries(process.cwd()),
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
