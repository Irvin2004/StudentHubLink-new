import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function javascriptFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name === "node_modules") return [];
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return javascriptFiles(path);
        return entry.isFile() && /\.(c?js|mjs)$/.test(entry.name) ? [path] : [];
    });
}

const files = [
    ...javascriptFiles("js"),
    ...javascriptFiles("src"),
    ...javascriptFiles("functions"),
    "eslint.config.js",
    "vite.config.js"
];

for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], {
        stdio: "inherit"
    });
    if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Syntax checked ${files.length} JavaScript files.`);
