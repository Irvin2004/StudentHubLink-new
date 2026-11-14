#!/usr/bin/env node
"use strict";

const admin = require("firebase-admin");
const { toPublicProfile } = require("./public-profile-migration");

const PAGE_SIZE = 200;
const APPLY = process.argv.includes("--apply");
const projectArg = process.argv.find((arg) => arg.startsWith("--project="));
const projectId = projectArg?.slice("--project=".length);

if (!projectId) {
    console.error(
        "Usage: node scripts/migrate-public-profiles.js --project=<firebase-project-id> [--apply]"
    );
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({ projectId });
}

const db = admin.firestore();
const { FieldPath, FieldValue } = admin.firestore;

async function migrate() {
    let cursor = null;
    let scanned = 0;
    let alreadyPresent = 0;
    let missing = 0;
    let created = 0;
    let sanitized = 0;

    console.log(
        APPLY
            ? `Applying public profile migration to project "${projectId}".`
            : `DRY RUN for project "${projectId}". No documents will be written.`
    );

    while (true) {
        let usersQuery = db
            .collection("users")
            .orderBy(FieldPath.documentId())
            .limit(PAGE_SIZE);

        if (cursor) usersQuery = usersQuery.startAfter(cursor);

        const usersPage = await usersQuery.get();
        if (usersPage.empty) break;

        const publicRefs = usersPage.docs.map((userDoc) =>
            db.collection("publicProfiles").doc(userDoc.id)
        );
        const publicSnapshots = await db.getAll(...publicRefs);

        for (let index = 0; index < usersPage.docs.length; index += 1) {
            const userDoc = usersPage.docs[index];
            const publicSnapshot = publicSnapshots[index];
            scanned += 1;

            if (publicSnapshot.exists) alreadyPresent += 1;
            else missing += 1;

            if (!APPLY) continue;

            // Re-read both documents transactionally so concurrent profile
            // edits are not lost. Replacing the document with the allowlisted
            // projection removes any legacy/private keys from publicProfiles.
            const result = await db.runTransaction(async (transaction) => {
                const [currentUser, currentPublic] = await Promise.all([
                    transaction.get(userDoc.ref),
                    transaction.get(publicRefs[index])
                ]);

                if (!currentUser.exists) return "skipped";

                const safeProfile = toPublicProfile(
                    currentUser.data(),
                    FieldValue.serverTimestamp(),
                    currentPublic.exists ? currentPublic.data() : {}
                );

                transaction.set(publicRefs[index], safeProfile);
                return currentPublic.exists ? "sanitized" : "created";
            });

            if (result === "created") created += 1;
            if (result === "sanitized") sanitized += 1;
        }

        cursor = usersPage.docs[usersPage.docs.length - 1];
        console.log(
            `Scanned ${scanned}; existing ${alreadyPresent}; missing ${missing}; created ${created}; sanitized ${sanitized}.`
        );

        if (usersPage.size < PAGE_SIZE) break;
    }

    console.log("\nMigration summary");
    console.log(`Project: ${projectId}`);
    console.log(`Private user documents scanned: ${scanned}`);
    console.log(`Public profiles already present: ${alreadyPresent}`);
    console.log(`Public profiles missing: ${missing}`);
    console.log(`Public profiles created: ${created}`);
    console.log(`Existing public profiles sanitized: ${sanitized}`);

    if (!APPLY && scanned > 0) {
        console.log(
            "\nDry run only. Re-run with --apply to create missing projections and sanitize existing ones."
        );
    }
}

migrate().catch((error) => {
    console.error("Public profile migration failed:", error);
    process.exitCode = 1;
});
