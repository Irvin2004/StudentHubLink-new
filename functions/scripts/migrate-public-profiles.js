#!/usr/bin/env node
"use strict";

const admin = require("firebase-admin");

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

function firstString(...values) {
    return values.find(
        (value) => typeof value === "string" && value.trim().length > 0
    )?.trim() || "";
}

function toPublicProfile(user) {
    const displayName = firstString(
        user.displayName,
        user.fullName,
        user.name,
        "Student"
    );

    return {
        displayName,
        fullName: firstString(user.fullName, displayName),
        name: firstString(user.name, displayName),
        photoURL: typeof user.photoURL === "string" ? user.photoURL : "",
        institution: typeof user.institution === "string" ? user.institution : "",
        course: typeof user.course === "string" ? user.course : "",
        yearOfStudy:
            typeof user.yearOfStudy === "string" ? user.yearOfStudy : "",
        bio: typeof user.bio === "string" ? user.bio : "",
        profileVisibility:
            user.profileVisibility === "private" ? "private" : "public",
        ...(user.joinedAt || user.createdAt
            ? { joinedAt: user.joinedAt || user.createdAt }
            : {}),
        ...(user.createdAt ? { createdAt: user.createdAt } : {}),
        updatedAt: FieldValue.serverTimestamp()
    };
}

async function migrate() {
    let cursor = null;
    let scanned = 0;
    let alreadyPresent = 0;
    let missing = 0;
    let written = 0;

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
        const batch = db.batch();
        let pageWrites = 0;

        for (let index = 0; index < usersPage.docs.length; index += 1) {
            const userDoc = usersPage.docs[index];
            const publicSnapshot = publicSnapshots[index];
            scanned += 1;

            if (publicSnapshot.exists) {
                alreadyPresent += 1;
                continue;
            }

            missing += 1;
            if (APPLY) {
                batch.create(publicRefs[index], toPublicProfile(userDoc.data()));
                pageWrites += 1;
            }
        }

        if (pageWrites > 0) {
            await batch.commit();
            written += pageWrites;
        }

        cursor = usersPage.docs[usersPage.docs.length - 1];
        console.log(
            `Scanned ${scanned}; existing ${alreadyPresent}; missing ${missing}; written ${written}.`
        );

        if (usersPage.size < PAGE_SIZE) break;
    }

    console.log("\nMigration summary");
    console.log(`Project: ${projectId}`);
    console.log(`Private user documents scanned: ${scanned}`);
    console.log(`Public profiles already present: ${alreadyPresent}`);
    console.log(`Public profiles missing: ${missing}`);
    console.log(`Public profiles created: ${written}`);

    if (!APPLY && missing > 0) {
        console.log(
            "\nDry run only. Re-run with --apply to create the missing public profiles."
        );
    }
}

migrate().catch((error) => {
    console.error("Public profile migration failed:", error);
    process.exitCode = 1;
});
