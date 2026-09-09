import { execFileSync } from "node:child_process";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";

const projectRoot = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf8")
);
const { name, version } = packageJson;
const outputDirectory = join(projectRoot, "release");
const archiveBaseName = `${name}-v${version}`;
const archivePath = join(outputDirectory, `${archiveBaseName}.zip`);

const excludedNames = new Set([
    ".git",
    ".github-cache",
    ".firebase",
    ".firebase-export",
    ".idea",
    ".vscode",
    "build",
    "coverage",
    "dist",
    "emulator-data",
    "firebase-export",
    "node_modules",
    "playwright-report",
    "release",
    "test-results"
]);

function shouldExclude(relativePath) {
    const segments = relativePath.split(/[\\/]/);
    if (segments.some((segment) => excludedNames.has(segment))) return true;

    const fileName = basename(relativePath);
    if (fileName === ".env.example") return false;
    if (fileName === ".env" || fileName.startsWith(".env.")) return true;

    return fileName.endsWith(".log") || fileName.endsWith(".zip");
}

function trackedFiles() {
    try {
        const output = execFileSync("git", ["ls-files", "-z"], {
            cwd: projectRoot,
            encoding: "utf8"
        });
        return output.split("\0").filter(Boolean);
    } catch {
        throw new Error(
            "Git is required to create the release archive. Install Git and run this command from the project repository."
        );
    }
}

function quotePowerShell(value) {
    return `'${value.replaceAll("'", "''")}'`;
}

function createZip(stagingParent, stagingDirectory) {
    if (process.platform === "win32") {
        const command = [
            "Add-Type -AssemblyName System.IO.Compression.FileSystem",
            "[System.AppContext]::SetSwitch('Switch.System.IO.Compression.ZipFile.UseBackslash', $false)",
            `[System.IO.Compression.ZipFile]::CreateFromDirectory(${quotePowerShell(stagingDirectory)}, ${quotePowerShell(archivePath)}, [System.IO.Compression.CompressionLevel]::Optimal, $true)`
        ].join("; ");

        execFileSync(
            "powershell",
            ["-NoProfile", "-NonInteractive", "-Command", command],
            {
                stdio: "inherit",
                // Let Windows PowerShell load its own modules, not inherited
                // PowerShell 7 modules from the calling terminal.
                env: { ...process.env, PSModulePath: undefined }
            }
        );
        return;
    }

    execFileSync("zip", ["-qr", archivePath, basename(stagingDirectory)], {
        cwd: stagingParent,
        stdio: "inherit"
    });
}

const stagingParent = mkdtempSync(join(tmpdir(), "studenthub-release-"));
const stagingDirectory = join(stagingParent, archiveBaseName);

try {
    mkdirSync(stagingDirectory, { recursive: true });
    mkdirSync(outputDirectory, { recursive: true });

    const files = trackedFiles().filter(
        (file) => !shouldExclude(file) && existsSync(join(projectRoot, file))
    );

    if (files.length === 0) {
        throw new Error(
            "No tracked project files were found for the release archive."
        );
    }

    for (const file of files) {
        const source = join(projectRoot, file);
        const destination = join(stagingDirectory, file);
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(source, destination);
    }

    rmSync(archivePath, { force: true });
    createZip(stagingParent, stagingDirectory);
    console.log(`Release archive created: ${archivePath}`);
} finally {
    rmSync(stagingParent, { recursive: true, force: true });
}
