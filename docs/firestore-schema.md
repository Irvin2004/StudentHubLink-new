# Firestore Schema

StudentHub uses top-level collections for users, resources, transactions,
libraries, activities, and platform metrics. Notifications live in a
recipient-owned subcollection under each user.

## Users

Path: `users/{uid}`

| Field            | Type      | Notes                                        |
| ---------------- | --------- | -------------------------------------------- |
| `uid`            | string    | Matches the Firebase Auth user ID.           |
| `name`           | string    | Display name used in the UI.                 |
| `fullName`       | string    | Full profile name.                           |
| `displayName`    | string    | Optional Firebase profile display name copy. |
| `email`          | string    | User email address.                          |
| `role`           | string    | Suggested values: `student`, `admin`.        |
| `photoURL`       | string    | Optional profile image URL.                  |
| `institution`    | string    | Student institution.                         |
| `course`         | string    | Student course.                              |
| `yearOfStudy`    | string    | Student year of study.                       |
| `bio`            | string    | Profile biography.                           |
| `totalUploads`   | number    | Resource upload counter.                     |
| `totalDownloads` | number    | Download and purchase counter.               |
| `totalEarnings`  | number    | Seller earnings from paid resources.         |
| `joinedAt`       | timestamp | Account creation time.                       |
| `createdAt`      | timestamp | Document creation time.                      |
| `updatedAt`      | timestamp | Last profile update time.                    |
| `lastLoginAt`    | timestamp | Last login time.                             |

## Resources

Path: `resources/{resourceId}`

| Field           | Type      | Notes                                                |
| --------------- | --------- | ---------------------------------------------------- |
| `title`         | string    | Resource title.                                      |
| `description`   | string    | Listing and detail summary.                          |
| `category`      | string    | Study category.                                      |
| `ownerId`       | string    | Resource owner user ID.                              |
| `ownerName`     | string    | Owner display name.                                  |
| `ownerEmail`    | string    | Owner email address.                                 |
| `price`         | number    | Use `0` for free resources.                          |
| `currency`      | string    | Current value: `ZAR`.                                |
| `approved`      | boolean   | Legacy approval flag.                                |
| `status`        | string    | Suggested values: `pending`, `approved`, `rejected`. |
| `downloadCount` | number    | Download and purchase count.                         |
| `purchaseCount` | number    | Paid purchase count.                                 |
| `fileUrl`       | string    | Firebase Storage download URL.                       |
| `filePath`      | string    | Firebase Storage object path.                        |
| `fileName`      | string    | Original uploaded filename.                          |
| `fileType`      | string    | Uploaded file MIME type.                             |
| `reviewedBy`    | string    | Admin user ID that reviewed the resource.            |
| `reviewedAt`    | timestamp | Review time.                                         |
| `createdAt`     | timestamp | Upload time.                                         |
| `updatedAt`     | timestamp | Last update time.                                    |

## Transactions

Path: `transactions/{transactionId}`

| Field                | Type      | Notes                                          |
| -------------------- | --------- | ---------------------------------------------- |
| `buyerId`            | string    | User who downloaded or purchased the resource. |
| `sellerId`           | string    | Owner of the resource.                         |
| `resourceId`         | string    | Resource ID.                                   |
| `resourceTitle`      | string    | Resource title at transaction time.            |
| `buyerEmail`         | string    | Buyer email address.                           |
| `sellerEmail`        | string    | Seller email address.                          |
| `type`               | string    | Suggested values: `download`, `purchase`.      |
| `amount`             | number    | `0` for free downloads.                        |
| `sellerAmount`       | number    | Seller share for paid purchases.               |
| `platformCommission` | number    | Platform share for paid purchases.             |
| `currency`           | string    | Current value: `ZAR`.                          |
| `status`             | string    | Current value: `completed`.                    |
| `createdAt`          | timestamp | Transaction time.                              |

## Libraries

Path: `libraries/{uid_resourceId}`

| Field           | Type      | Notes                                     |
| --------------- | --------- | ----------------------------------------- |
| `userId`        | string    | Library owner user ID.                    |
| `resourceId`    | string    | Resource ID.                              |
| `resourceTitle` | string    | Resource title.                           |
| `title`         | string    | Display title.                            |
| `description`   | string    | Resource description.                     |
| `category`      | string    | Resource category.                        |
| `ownerName`     | string    | Resource owner display name.              |
| `price`         | number    | Resource price at access time.            |
| `action`        | string    | Suggested values: `download`, `purchase`. |
| `type`          | string    | Mirrors `action` for compatibility.       |
| `fileUrl`       | string    | Download URL.                             |
| `downloadUrl`   | string    | Optional alternate download URL.          |
| `createdAt`     | timestamp | Original resource creation time.          |
| `addedAt`       | timestamp | Library insertion time.                   |
| `updatedAt`     | timestamp | Last library item update time.            |

## Activities

Path: `activities/{activityId}`

| Field         | Type      | Notes                                                                                            |
| ------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `userId`      | string    | User the activity belongs to.                                                                    |
| `type`        | string    | Suggested values: `register`, `upload`, `download`, `purchase`, `sale`, `approval`, `rejection`. |
| `title`       | string    | Short activity title.                                                                            |
| `description` | string    | Activity details for the dashboard feed.                                                         |
| `icon`        | string    | UI icon key.                                                                                     |
| `read`        | boolean   | Defaults to `false`.                                                                             |
| `createdAt`   | timestamp | Activity creation time.                                                                          |

## Notifications

Path: `users/{userId}/notifications/{notificationId}`

| Field            | Type        | Notes                                                                 |
| ---------------- | ----------- | --------------------------------------------------------------------- |
| `recipientId`    | string      | User who should receive the notification; matches the parent user ID. |
| `senderId`       | string/null | User responsible for the source event.                                |
| `groupId`        | string/null | Related study group.                                                  |
| `conversationId` | string/null | Conversation opened by message notifications.                         |
| `referenceId`    | string/null | Assignment, message, resource, or friend-request ID.                  |
| `title`          | string      | Short notification title.                                             |
| `message`        | string      | Notification body.                                                    |
| `type`           | string      | Value from `NOTIFICATION_TYPES`.                                      |
| `read`           | boolean     | Recipient read state.                                                 |
| `createdAt`      | timestamp   | Server creation time.                                                 |
| `updatedAt`      | timestamp   | Server modification time.                                             |
| `type`           | string      | Suggested value: `info` unless more specific types are added.         |
| `read`           | boolean     | Defaults to `false`.                                                  |
| `createdAt`      | timestamp   | Notification creation time.                                           |

## Platform Metrics

Path: `platform/financials`

| Field               | Type      | Notes                                                     |
| ------------------- | --------- | --------------------------------------------------------- |
| `totalRevenue`      | number    | Total platform commission from paid purchases.            |
| `totalTransactions` | number    | Number of paid transactions counted for platform metrics. |
| `updatedAt`         | timestamp | Last metrics update time.                                 |

## Study Groups

Path: groups/{groupId}

| Field       | Type      | Notes                                 |
| ----------- | --------- | ------------------------------------- |
| name        | string    | Group display name.                   |
| description | string    | Optional group description.           |
| moduleCode  | string    | Optional uppercase module code.       |
| moduleName  | string    | Module or subject display name.       |
| tags        | array     | Up to five searchable group tags.     |
| ownerId     | string    | Firebase Auth UID of the group owner. |
| visibility  | string    | public or private.                    |
| photoURL    | string    | Optional group image URL.             |
| memberCount | number    | Starts at 1.                          |
| createdAt   | timestamp | Group creation time.                  |
| updatedAt   | timestamp | Last group update time.               |

Member path: groups/{groupId}/members/{userId}

| Field       | Type      | Notes                               |
| ----------- | --------- | ----------------------------------- |
| userId      | string    | Matches the member document ID.     |
| displayName | string    | Member display name snapshot.       |
| photoURL    | string    | Optional profile image snapshot.    |
| role        | string    | owner, admin, moderator, or member. |
| joinedAt    | timestamp | Membership creation time.           |

## Group Resources

Path: `groups/{groupId}/resources/{resourceId}`

| Field               | Type      | Notes                                              |
| ------------------- | --------- | -------------------------------------------------- |
| `title`             | string    | Trimmed display title, limited to 100 characters.  |
| `description`       | string    | Optional description, limited to 500 characters.   |
| `category`          | string    | Fixed value from `resource-categories.js`.         |
| `fileURL`           | string    | Firebase Storage download URL.                     |
| `storagePath`       | string    | Original Storage path required for later deletion. |
| `fileName`          | string    | Original uploaded filename.                        |
| `fileSize`          | number    | File size in bytes.                                |
| `mimeType`          | string    | Uploaded file MIME type.                           |
| `uploaderId`        | string    | Firebase Auth UID of the uploader.                 |
| `uploaderName`      | string    | Uploader display-name snapshot.                    |
| `uploaderPhotoURL`  | string    | Optional uploader avatar snapshot.                 |
| `downloadCount`     | number    | Starts at zero.                                    |
| `verificationCount` | number    | Starts at zero.                                    |
| `verifiedBy`        | array     | User IDs that verified the resource.               |
| `createdAt`         | timestamp | Resource creation time.                            |
| `updatedAt`         | timestamp | Last resource update time.                         |

## Conversations

Path: `conversations/{conversationId}`

Direct conversations use `type: "direct"` and keep `participantIds` plus
`conversationKey`. Legacy conversations without `type` are normalized as direct
conversations.

Group conversations use the deterministic ID `group_{groupId}` with
`type: "group"`, `groupId`, `title`, and a member-count snapshot. Access is
derived from `groups/{groupId}/members/{uid}` rather than a duplicated
participant list.

Both types share `lastMessage`, `lastMessageType`, `lastMessageSenderId`,
`lastMessageAt`, `createdAt`, and `updatedAt`.

## Messages

Path: `messages/{messageId}`

All messages share the same top-level collection. Direct messages set
`receiverId` and use `deliveredAt`/`readAt`. Group messages set
`receiverId: null`, include `groupId` and `senderName`, and store member
receipts in `readBy`.

Typing documents at `typingStatus/{conversationId}_{userId}` include
`displayName`, allowing one or several group member names to appear in the
indicator.

## Main Queries

- Public marketplace resources:
  `resources where status == "approved" order by createdAt desc`
- Admin review queue: `resources where status == "pending"`
- User uploads: `resources where ownerId == currentUser.uid`
- User library: `libraries where userId == currentUser.uid`
- User notifications:
  `users/{currentUser.uid}/notifications order by createdAt desc limit 100`
- User activity: `activities where userId == currentUser.uid`
- Completed transactions: `transactions where status == "completed"`
- Study group discovery: `getDocs(collection(db, "groups"))` with client-side
  search and subject filtering

## Notes

- Keep status strings aligned with `js/utils/constants.js`.
- Prefer `serverTimestamp()` for timestamps written by the app.
- Prefer `increment()` for counters to reduce race conditions.
- Firestore indexes may be required for compound `where` plus `orderBy` queries.
