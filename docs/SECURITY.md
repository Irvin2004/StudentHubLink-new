# Security

## Authentication

StudentHub uses Firebase Authentication for user identity.

Authenticated users can:

- Access protected pages.
- Upload resources.
- Save favorites.
- Comment and review resources.
- Follow other users.
- Message mutual followers.

## Authorization

Authorization is enforced with Firestore Security Rules.

Rules are stored in:

```text
firestore.rules
```

## User Roles

### Students

Students can:

- Upload resources.
- Review resources.
- Comment on resources.
- Save favorites.
- Add resources to their library.
- Follow users.
- Chat with mutual followers.
- Read their own notifications and activity data.

Students cannot:

- Change their own role.
- Change their own UID.
- Update derived rating totals directly.
- Award themselves achievements directly.
- Create notifications for other users.

### Admins

Admins can:

- Approve resources.
- Reject resources.
- Delete inappropriate content.
- Manage users.
- Review platform activity.

## Protected User Fields

User document updates prevent role escalation.

Owners cannot change:

- `role`
- `uid`

## Backend Ownership

Cloud Functions own sensitive business logic, including:

- Rating aggregation
- Achievement awarding
- Cross-user notifications
- Derived statistics
- Future analytics counters

## Firestore Rules Deployment

Rules were deployed to `studenthub-c9bc0` with:

```powershell
firebase deploy --only firestore:rules
```

## Known Security Migration Items

The following frontend writes are expected to move to Cloud Functions:

- Achievement creation
- Cross-user notification creation
- Resource download counters
- User reputation/statistics counters
- Advanced moderation workflows
