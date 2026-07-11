const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { db } = require("../config/firebase");
const { uniqueValues } = require("../utils/helpers");

exports.updateResourceRating = onDocumentWritten(
  "reviews/{reviewId}",
  async (event) => {
    if (!event.data) {
      return;
    }

    const beforeResourceId = event.data.before.exists
      ? event.data.before.data().resourceId
      : null;

    const afterResourceId = event.data.after.exists
      ? event.data.after.data().resourceId
      : null;

    const resourceIds = uniqueValues([
      beforeResourceId,
      afterResourceId
    ]);

    await Promise.all(
      resourceIds.map((resourceId) => recalculateResourceRating(resourceId))
    );
  }
);

async function recalculateResourceRating(resourceId) {
  const snapshot = await db
    .collection("reviews")
    .where("resourceId", "==", resourceId)
    .get();

  let total = 0;

  snapshot.forEach((reviewDoc) => {
    total += Number(reviewDoc.data().rating || 0);
  });

  const reviewCount = snapshot.size;

  const averageRating = reviewCount
    ? total / reviewCount
    : 0;

  await db
    .collection("resources")
    .doc(resourceId)
    .set(
      {
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount
      },
      { merge: true }
    );
}
