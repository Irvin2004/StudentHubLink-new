# Firestore Database Structure

Use top-level collections for users, resources, transactions, notifications, and activity.

## Users

`users/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | User's display name. |
| `email` | string | User's email address. |
| `role` | string | Suggested values: `student`, `admin`. |
| `joinedAt` | timestamp | Set when the account is created. |
| `totalUploads` | number | Number of resources uploaded by the user. |
| `totalDownloads` | number | Number of resources downloaded by the user. |
| `totalEarnings` | number | Seller earnings from paid resources. |

## Resources

`resources/{resourceId}`

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Resource title. |
| `description` | string | Short summary shown in listings. |
| `category` | string | Study category. |
| `ownerId` | string | Matches `users/{uid}`. |
| `price` | number | Use `0` for free resources. |
| `approved` | boolean | `false` until an admin approves the resource. |
| `downloadCount` | number | Incremented when downloaded or purchased. |
| `createdAt` | timestamp | Set when uploaded. |

The app also stores file metadata such as `fileUrl`, `filePath`, `fileName`, and `fileType` so Firebase Storage downloads work. It keeps `status`, `reviewedAt`, and `reviewedBy` for the admin review workflow.

## Transactions

`transactions/{transactionId}`

| Field | Type | Notes |
| --- | --- | --- |
| `buyerId` | string | User who downloaded or purchased the resource. |
| `sellerId` | string | Owner of the resource. |
| `resourceId` | string | Downloaded or purchased resource. |
| `amount` | number | `0` for free downloads. |
| `createdAt` | timestamp | Set when the transaction is created. |

The app also stores reporting fields such as `resourceTitle`, `buyerEmail`, `sellerEmail`, `type`, `currency`, `status`, `sellerAmount`, and `platformCommission`.

## Activity

`activity/{activityId}`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | string | User the activity belongs to. |
| `type` | string | Suggested values: `upload`, `download`, `purchase`, `sale`, `approval`, `rejection`. |
| `title` | string | Short activity title. |
| `description` | string | Activity details for the dashboard feed. |
| `createdAt` | timestamp | Set when the activity is created. |

## Notifications

`notifications/{notificationId}`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | string | User who should receive the notification. |
| `title` | string | Short notification title. |
| `message` | string | Notification body. |
| `read` | boolean | Defaults to `false`. |
| `createdAt` | timestamp | Set when the notification is created. |

## Main Queries

- Public resources: `resources where approved == true`
- Admin review queue: `resources where status == "pending"`
- User uploads: `resources where ownerId == currentUser.uid`
- User notifications: `notifications where userId == currentUser.uid`
- User activity: `activity where userId == currentUser.uid`
