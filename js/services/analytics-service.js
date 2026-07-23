import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";

export async function getMonthlyUploads(userId) {
    const snapshot = await getDocs(
        query(collection(db, "resources"), where("ownerId", "==", userId))
    );

    const labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    const values = new Array(12).fill(0);

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (!data.createdAt) return;

        const date =
            typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate()
                : new Date(data.createdAt);

        values[date.getMonth()]++;
    });

    return {
        labels,

        values
    };
}
