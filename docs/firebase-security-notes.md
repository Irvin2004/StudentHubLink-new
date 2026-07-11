# Firebase Security Notes

## Spark-safe frontend hardening

The project now includes `firestore.rules` so rules can be published before Cloud Functions are deployed.

Rules were deployed to `studenthub-c9bc0` on 2026-07-11 with:

```powershell
firebase deploy --only firestore:rules
```

The `/users/{userId}` update rule protects immutable identity fields:

- `role` cannot be changed by the owner.
- `uid` cannot be changed by the owner.
- admins can still manage user documents.

## Expected frontend permission failures

These writes are intentionally expected to fail after strict rules are published. They should move to Cloud Functions once the Firebase project is upgraded to Blaze:

- Updating `resources.averageRating` and `resources.reviewCount` from `reviews-service.js`.
- Updating derived resource counters such as `downloadCount`.
- Awarding achievements from client code.
- Creating notifications for another user from client code.
- Updating another user's statistics or derived counters from client code.

## Frontend fallbacks added

The core user action should still complete when a derived write is denied:

- Reviews still submit when the client-side resource rating update is denied.
- Downloads still add the resource to the user's library when the client-side resource counter update is denied.
- Downloads no longer fail when the client-side achievement write is denied.

## Cloud Functions prep

The local `functions/` folder includes the first backend trigger:

- `updateResourceRating`

It lives in `functions/reviews/review-functions.js`, is exported from `functions/index.js`, and listens to `reviews/{reviewId}` writes. It recalculates `averageRating` and `reviewCount` from the current review documents. This is idempotent, so duplicate trigger delivery or out-of-order events will still produce the correct aggregate values.

The frontend review service no longer writes `averageRating` or `reviewCount`; it only creates, updates, deletes, and reads review documents.

Do not deploy functions until the Firebase project is upgraded to Blaze.
