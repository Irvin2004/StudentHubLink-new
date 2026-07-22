# Services

StudentHub uses Firebase directly from frontend service modules and Cloud Functions for sensitive backend workflows. This document lists the main application-facing APIs.

## Authentication

- `getUserDocument(user)`
- `login()`
- `logout()`
- `register()`
- `updateLastLogin(user)`

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

## Reviews

- `addReview({ resourceId, userId, userName, rating, review })`
- `getReviewsForResource(resourceId)`
- `getUserReview(resourceId, userId)`
- `updateReview({ reviewId, rating, review })`
- `deleteReview(reviewId)`

Rating aggregation is handled by the Cloud Function `updateResourceRating`.

## Comments

- `addComment({ resourceId, userId, userName, message })`
- `getCommentsForResource(resourceId)`
- `subscribeToComments(resourceId, callback)`
- `updateComment(commentId, message)`
- `deleteComment(commentId)`

## Follows

- `getFollowRecord(followerId, followingId)`
- `followUser(followerId, followingId)`
- `unfollowUser(followerId, followingId)`
- `isFollowing(followerId, followingId)`
- `areMutuals(firstUserId, secondUserId)`

## Conversations

`conversation-service.js` owns conversation creation, loading, and real-time conversation lists.

- `createOrGetConversation(firstUserId, secondUserId)`
- `createOrGetGroupConversation({ groupId, title, memberCount })`
- `getConversation(firstUserId, secondUserId)`
- `getConversationById(conversationId)`
- `subscribeToUserConversations(userId, callback, onError)`

## Messages

`message-service.js` owns message delivery, edits, deletion, replies, reactions, and receipts.

- `sendMessage({ conversationId, senderId, receiverId, groupId, conversationType, senderName, type, text })`
- `subscribeToMessages(conversationId, callback, onError)`
- `editMessage(...)`
- `deleteMessageForEveryone(...)`
- `deleteMessageForMe(...)`
- `reactToMessage(...)`
- `startReply(message)`

## Presence

`presence-service.js` owns online presence and typing state.

- `setUserOnline(userId)`
- `setUserOffline(userId)`
- `subscribeToPresence(userId, callback, onError)`
- `setTypingStatus(conversationId, userId, isTyping, displayName)`
- `subscribeToTypingStatus(conversationId, callback, onError)`

## Group Resources

- `uploadGroupResource(file, groupId, onProgress)`
- `createGroupResource(resourceData)`
- `getGroupResources(groupId)`
- `getGroupResource({ groupId, resourceId })`
## Notifications

- `createNotification(notificationData)`
- `getNotifications(userId)`
- `getNotification(userId, notificationId)`
- `markAsRead(userId, notificationId)`
- `markAllAsRead(userId)`
- `deleteNotification(userId, notificationId)`
- `subscribeToNotifications(userId, callback, onError)`

Cross-user writes are authorized only when Firestore can verify the referenced
assignment, message, resource, or friend request.

## Domain Events

- `emitAssignmentCreated({ assignment, groupId, creatorId })`
- `emitMessageSent({ message, chatId, senderId, chatType })`
- `emitFriendRequestSent({ senderId, recipientId, requestId })`
- `emitFriendRequestAccepted({ senderId, recipientId, requestId })`

## Friends

- `sendFriendRequest(senderId, recipientId)`
- `acceptFriendRequest(requestId, recipientId)`

## Achievements

- `awardAchievement(userId, achievement)`

Achievement awarding should move to Cloud Functions.

## Analytics

- `getMonthlyUploads(userId)`
- Dashboard stats and chart rendering modules
- Leaderboard loading modules

## Cloud Functions

- `updateResourceRating`: recalculates `averageRating` and `reviewCount` whenever a review document is created, updated, or deleted.
