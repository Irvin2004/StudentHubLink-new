import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";

let environment;
const projectId = "demo-studenthub-v2";
before(async () => {
    environment = await initializeTestEnvironment({
        projectId,
        firestore: {
            host: "127.0.0.1",
            port: 8080,
            rules: readFileSync("firestore.rules", "utf8")
        },
        storage: {
            host: "127.0.0.1",
            port: 9199,
            rules: readFileSync("storage.rules", "utf8")
        }
    });
    await environment.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        for (let index = 0; index < 11; index += 1) {
            const communityId = `community-${index}`;
            await setDoc(
                doc(db, `communities/${communityId}/members/student`),
                { userId: "student", role: "member" }
            );
            await setDoc(
                doc(
                    db,
                    `communities/${communityId}/channels/general/files/file-1`
                ),
                {
                    communityId,
                    channelId: "general",
                    uploadedAt: new Date(),
                    uploadedBy: "student"
                }
            );
        }
        await setDoc(
            doc(db, "communities/private/channels/general/files/private-file"),
            { communityId: "private", uploadedAt: new Date() }
        );
        await setDoc(doc(db, "users/student"), {
            uid: "student",
            email: "student@example.com",
            displayName: "Student",
            role: "student",
            totalEarnings: 125,
            totalDownloads: 10,
            totalUploads: 3,
            profileVisibility: "public"
        });
        await setDoc(doc(db, "publicProfiles/student"), {
            displayName: "Student",
            fullName: "Student",
            photoURL: "",
            profileVisibility: "public"
        });
        await setDoc(doc(db, "friends/student_peer"), {
            participantIds: ["student", "peer"],
            requestId: "student_peer",
            createdAt: new Date()
        });
        await setDoc(doc(db, "friendRequests/student_peer"), {
            senderId: "student",
            receiverId: "peer",
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await uploadBytes(
            ref(context.storage(), "resources/student/legacy.pdf"),
            new Uint8Array([1]),
            { contentType: "application/pdf" }
        );
    });
});

test(
    "users cannot change private identity or server-managed account totals",
    async () => {
        const db = environment.authenticatedContext("student").firestore();
        const user = doc(db, "users/student");

        await assertSucceeds(
            setDoc(user, { displayName: "Updated Student" }, { merge: true })
        );
        await assertFails(
            setDoc(user, { email: "attacker@example.com" }, { merge: true })
        );
        await assertFails(
            setDoc(user, { totalEarnings: 999999 }, { merge: true })
        );
        await assertFails(
            setDoc(user, { totalDownloads: 999999 }, { merge: true })
        );
        await assertFails(
            setDoc(user, { totalUploads: 999999 }, { merge: true })
        );
    }
);

test(
    "private user documents are readable only by their owner or an admin",
    async () => {
        const owner = environment.authenticatedContext("student").firestore();
        const peer = environment.authenticatedContext("peer").firestore();
        const anonymous = environment.unauthenticatedContext().firestore();

        await assertSucceeds(getDoc(doc(owner, "users/student")));
        await assertFails(getDoc(doc(peer, "users/student")));
        await assertFails(getDoc(doc(anonymous, "users/student")));
        await assertFails(getDocs(collection(peer, "users")));
    }
);

test(
    "public profiles expose only allowlisted profile fields and respect visibility",
    async () => {
        const student = environment.authenticatedContext("student").firestore();
        const peer = environment.authenticatedContext("peer").firestore();
        const profile = doc(peer, "publicProfiles/student");

        await assertSucceeds(getDoc(profile));
        await assertSucceeds(
            setDoc(
                doc(student, "publicProfiles/student"),
                { displayName: "Updated Student" },
                { merge: true }
            )
        );
        await assertFails(
            setDoc(
                doc(student, "publicProfiles/student"),
                { email: "student@example.com" },
                { merge: true }
            )
        );
        await assertFails(
            setDoc(doc(student, "publicProfiles/forged"), {
                displayName: "Forged",
                email: "private@example.com",
                profileVisibility: "public"
            })
        );
        await assertSucceeds(
            setDoc(
                doc(student, "publicProfiles/student"),
                { profileVisibility: "private" },
                { merge: true }
            )
        );
        await assertFails(getDoc(profile));
        await assertSucceeds(getDoc(doc(student, "publicProfiles/student")));
    }
);

test("friend preflight permits only caller-bound missing pair documents", async () => {
    const student = environment.authenticatedContext("student").firestore();
    const outsider = environment.authenticatedContext("outsider").firestore();

    for (const collectionName of ["friends", "friendRequests"]) {
        await assertSucceeds(
            getDoc(doc(student, `${collectionName}/student_newpeer`))
        );
        await assertSucceeds(
            getDoc(doc(student, `${collectionName}/newpeer_student`))
        );
        await assertSucceeds(
            getDoc(doc(student, `${collectionName}/student_peer`))
        );
        await assertFails(getDoc(doc(student, `${collectionName}/other_pair`)));
        await assertFails(
            getDoc(doc(outsider, `${collectionName}/student_newpeer`))
        );
        await assertFails(getDocs(collection(student, collectionName)));
    }
});
after(async () => {
    await environment?.cleanup();
});

test("member can query ten communities but cannot include a forbidden community", async () => {
    const db = environment.authenticatedContext("student").firestore();
    const communities = Array.from(
        { length: 10 },
        (_, index) => `community-${index}`
    );
    const files = (ids) =>
        query(
            collectionGroup(db, "files"),
            where("communityId", "in", ids),
            orderBy("uploadedAt", "desc"),
            limit(30)
        );
    await assertSucceeds(getDocs(files(communities)));
    await assertFails(getDocs(files(["community-0", "private"])));
    await assertFails(getDocs(query(collectionGroup(db, "files"), limit(30))));
    await assertFails(
        getDocs(
            query(
                collectionGroup(
                    environment.authenticatedContext("outsider").firestore(),
                    "files"
                ),
                where("communityId", "==", "community-0")
            )
        )
    );
    await assertFails(
        getDocs(
            query(
                collectionGroup(
                    environment.unauthenticatedContext().firestore(),
                    "files"
                ),
                where("communityId", "==", "community-0")
            )
        )
    );
});

test("file fields cannot forge access to another community or namespace", async () => {
    const db = environment.authenticatedContext("student").firestore();
    const data = {
        name: "notes.pdf",
        filename: "notes.pdf",
        normalizedFilename: "notes.pdf",
        originalName: "notes.pdf",
        extension: "pdf",
        size: 1,
        type: "application/pdf",
        url: "https://example.invalid/notes.pdf",
        storagePath:
            "communities/community-0/channels/general/files/forged/notes.pdf",
        uploadedByName: "Student",
        messageId: null,
        tags: [],
        communityId: "community-0",
        channelId: "general",
        uploadedBy: "student",
        uploadedAt: serverTimestamp()
    };
    await assertSucceeds(
        setDoc(
            doc(db, "communities/community-0/channels/general/files/forged"),
            data
        )
    );
    await assertFails(
        setDoc(
            doc(db, "communities/private/channels/general/files/forged"),
            data
        )
    );
    await assertFails(setDoc(doc(db, "unrelated/root/files/forged"), data));
    await assertFails(
        setDoc(
            doc(db, "communities/community-0/channels/general/files/forged"),
            { ...data, communityId: "private" }
        )
    );
});

test("retired marketplace objects allow owner recovery but deny public access and new uploads", async () => {
    const path = "resources/student/legacy.pdf";
    await assertSucceeds(
        getMetadata(
            ref(environment.authenticatedContext("student").storage(), path)
        )
    );
    await assertFails(
        getMetadata(ref(environment.unauthenticatedContext().storage(), path))
    );
    await assertFails(
        getMetadata(
            ref(environment.authenticatedContext("outsider").storage(), path)
        )
    );
    await assertFails(
        uploadBytes(
            ref(
                environment.authenticatedContext("student").storage(),
                "resources/student/new.pdf"
            ),
            new Uint8Array([1]),
            { contentType: "application/pdf" }
        )
    );
});

test("a rejected generated quiz batch persists no partial parent or questions", async () => {
    const db = environment.authenticatedContext("student").firestore();
    const parent = doc(db, "users/student/quizzes/generated");
    const child = doc(db, "users/student/quizzes/generated/questions/one");
    const save = (prompt) => {
        const batch = writeBatch(db);
        batch.set(parent, {
            title: "Biology",
            subject: "Biology",
            questionCount: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        batch.set(child, {
            prompt,
            options: ["A", "B", "C", "D"],
            correctOptionIndex: 0,
            position: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return batch.commit();
    };
    await assertFails(save(""));
    const empty = await getDoc(parent);
    if (empty.exists()) throw new Error("Rejected batch left a parent behind");
    await assertSucceeds(save("What is a cell?"));
    await assertSucceeds(getDoc(child));
    await assertFails(
        getDoc(
            doc(
                environment.authenticatedContext("outsider").firestore(),
                parent.path
            )
        )
    );
});

test("a rejected generated flashcard batch leaves no deck and can be retried", async () => {
    const db = environment.authenticatedContext("student").firestore();
    const parent = doc(db, "users/student/flashcardDecks/generated");
    const card = doc(db, parent.path + "/cards/one");
    const save = (back) => {
        const batch = writeBatch(db);
        batch.set(parent, {
            title: "Biology",
            subject: "Biology",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        batch.set(card, {
            front: "What is a cell?",
            back,
            reviewCount: 0,
            easeRating: null,
            lastReviewedAt: null,
            nextReviewAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return batch.commit();
    };
    await assertFails(save(""));
    if ((await getDoc(parent)).exists())
        throw new Error("Rejected batch left a deck behind");
    await assertSucceeds(save("The basic unit of life."));
    if (!(await getDoc(card)).exists())
        throw new Error("Successful batch omitted the card");
    await assertFails(
        getDoc(
            doc(
                environment.authenticatedContext("outsider").firestore(),
                card.path
            )
        )
    );
});
