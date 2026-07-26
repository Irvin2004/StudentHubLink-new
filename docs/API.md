# StudentHub service API

This document summarizes application-facing service APIs. Source JSDoc is
authoritative for exact parameters and return values.

## Authentication and users

- `login(email, password)`
- `register({ fullName, email, password })`
- `logout()`
- `resetPassword(email)`
- `onAuthStateChanged(callback, onError)`
- `updateProfile({ displayName, photoURL })`
- `createUserProfileDocument(user, data)`
- `getUserProfile(userId)`

## Resources

- `uploadResource(user)`
- `getApprovedResources()`
- `handleResourceAction(resource, user)`
- `getRelatedResources(resource)`
- `processDownload(resource, user)`
- `processPurchase(resource, user)`

## Favorites

- `getFavoriteRecord(userId, resourceId)`
- `isFavorite(userId, resourceId)`
- `addFavorite(userId, resourceId)`
- `removeFavorite(userId, resourceId)`
- `toggleFavorite(userId, resourceId)`
- `getFavoriteIds(userId)`

## Reviews and comments

- `addReview({ resourceId, userId, userName, rating, review })`
- `getReviewsForResource(resourceId)`
- `updateReview({ reviewId, rating, review })`
- `deleteReview(reviewId)`
- `addComment({ resourceId, userId, userName, message })`
- `subscribeToComments(resourceId, callback)`
- `updateComment(commentId, message)`
- `deleteComment(commentId)`

Rating aggregation is handled by the `updateResourceRating` Cloud Function.

## Conversations and messages

- `createOrGetConversation(firstUserId, secondUserId)`
- `createOrGetGroupConversation({ groupId, title, memberCount })`
- `subscribeToUserConversations(userId, callback, onError)`
- `sendMessage(messageData)`
- `sendReplyMessage(messageData)`
- `sendVoiceMessage(messageData)`
- `subscribeToMessages(conversationId, callback, onError)`
- `editMessage(...)`
- `deleteMessageForEveryone(...)`
- `deleteMessageForMe(...)`
- `addReaction(...)`
- `removeReaction(...)`
- `markMessageDelivered(...)`
- `markMessageRead(...)`

## Presence

- `setUserOnline(userId)`
- `setUserOffline(userId)`
- `subscribeToPresence(userId, callback, onError)`
- `setUserTyping(userId, conversationId)`
- `stopTyping(userId)`

## Groups and assignments

- `createStudyGroup(groupData)`
- `getStudyGroups()`
- `joinStudyGroup(groupId, userId)`
- `leaveStudyGroup(groupId, userId)`
- `subscribeToUserStudyGroups(userId, callback, onError)`
- `createAssignment(assignmentData)`
- `subscribeToAssignments(groupId, callback, onError)`
- `uploadGroupResource(file, groupId, uploaderId, onProgress)`

## Notifications

- `createNotification(notificationData)`
- `getNotifications(userId)`
- `markAsRead(userId, notificationId)`
- `markAllAsRead(userId)`
- `deleteNotification(userId, notificationId)`
- `subscribeToNotifications(userId, callback, onError)`

Cross-user writes are authorized only when Firestore can verify the source
assignment, message, resource, membership, or friend request.

## Settings

- `getUserSettings(userId)`
- `saveUserSettings(userId, settings)`
- `updateUserSettings(userId, updates)`
- `subscribeToUserSettings(userId, onSettingsChange, onError)`

## Storage

- `uploadChatAttachment(file, conversationId, senderId, onProgress)`
- `uploadVoiceMessage(conversationId, userId, blob, onProgress)`
- `deleteVoiceMessage(storagePath)`

Storage operations do not write Firestore message documents.

## Error and feedback

- `showError(options)`
- `showWarning(options)`
- `showSuccess(options)`
- `showInfo(options)`
- `handleError(error, options)`
- `logError(error, context)`

Services throw errors. Controllers decide whether to show feedback, recover, or
rethrow.
