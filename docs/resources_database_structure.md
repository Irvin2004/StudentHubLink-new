# Resources Database Structure

Use a top-level `resources` collection for study material. Each resource is one Firestore document.

## Collection

`resources/{resourceId}`

## Fields

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | yes | `Mathematics Exam Prep` | Display title and search text. |
| `description` | string | yes | `Past papers and worked solutions.` | Short summary shown on resource cards. |
| `category` | string | yes | `Mathematics` | Use consistent category labels. |
| `price` | number | yes | `25` | Use `0` for free resources. |
| `currency` | string | yes | `ZAR` | Keeps pricing explicit. |
| `fileUrl` | string | yes | `https://...` | Firebase Storage download URL. |
| `filePath` | string | yes | `resources/userId/file.pdf` | Firebase Storage path for admin actions. |
| `fileName` | string | yes | `math-prep.pdf` | Original or sanitized file name. |
| `fileType` | string | yes | `application/pdf` | Helps validate downloads/previews. |
| `ownerId` | string | yes | `firebaseUserUid` | Matches `users/{uid}`. |
| `ownerName` | string | yes | `Amo Student` | Snapshot for faster listing. |
| `ownerEmail` | string | no | `student@example.com` | Useful for admin review. |
| `status` | string | yes | `pending` | Suggested values: `pending`, `approved`, `rejected`, `archived`. |
| `downloadCount` | number | yes | `0` | Increment when downloaded. |
| `purchaseCount` | number | yes | `0` | Increment after paid purchases. |
| `averageRating` | number | no | `4.5` | Optional future rating support. |
| `createdAt` | timestamp | yes | server timestamp | Set on upload. |
| `updatedAt` | timestamp | yes | server timestamp | Update on edits/review actions. |
| `reviewedAt` | timestamp | no | server timestamp | Set by admin approval/rejection. |
| `reviewedBy` | string | no | `adminUid` | Admin user id. |
| `rejectionReason` | string | no | `Blurry scan` | Only for rejected resources. |

## Suggested Queries

- Student uploads: `resources where ownerId == currentUser.uid`
- Public listing: `resources where status == "approved"`
- Admin review queue: `resources where status == "pending"`
- Category pages: `resources where status == "approved" and category == selectedCategory`

## Related Collections

`users/{uid}` should keep these counters for fast dashboard/profile display:

| Field | Type | Notes |
| --- | --- | --- |
| `totalUploads` | number | Can mirror the count of resources owned by the user. |
| `totalDownloads` | number | Sum of downloads across the user's resources or user activity. |
| `totalEarnings` | number | Sum of completed paid purchases for this user's resources. |

## Transactions Collection

Use a top-level `transactions` collection for download and purchase records. Do not store buyer lists directly inside `resources/{resourceId}`.

`transactions/{transactionId}`

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `resourceId` | string | yes | `abc123` | Purchased or downloaded resource. |
| `resourceTitle` | string | yes | `Mathematics Exam Prep` | Snapshot for reports. |
| `buyerId` | string | yes | `studentUid` | Current user. |
| `buyerEmail` | string | yes | `student@example.com` | Snapshot for admin. |
| `sellerId` | string | yes | `ownerUid` | Resource owner. |
| `sellerEmail` | string | no | `owner@example.com` | Snapshot for admin. |
| `type` | string | yes | `purchase` | Suggested values: `download`, `purchase`. |
| `amount` | number | yes | `25` | `0` for free downloads. |
| `currency` | string | yes | `ZAR` | Pricing currency. |
| `status` | string | yes | `completed` | Later payment gateways can add `pending`, `failed`, `refunded`. |
| `createdAt` | timestamp | yes | server timestamp | Transaction time. |
