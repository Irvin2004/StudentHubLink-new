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

## Messaging

- `createOrGetConversation(firstUserId, secondUserId)`
- `getConversation(firstUserId, secondUserId)`
- `getConversationById(conversationId)`
- `sendMessage({ conversationId, senderId, receiverId, text })`
- `subscribeToMessages(conversationId, callback)`
- `setTypingStatus(conversationId, userId, isTyping)`
- `subscribeToTypingStatus(conversationId, currentUserId, callback)`

## Notifications

- `createNotification(notificationOrUserId, title, message, type)`
- `getNotifications(userId)`
- `markAsRead(notificationId)`

Sensitive notification creation for other users should move to Cloud Functions.

## Achievements

- `awardAchievement(userId, achievement)`

Achievement awarding should move to Cloud Functions.

## Analytics

- `getMonthlyUploads(userId)`
- Dashboard stats and chart rendering modules
- Leaderboard loading modules

## Cloud Functions

- `updateResourceRating`: recalculates `averageRating` and `reviewCount` whenever a review document is created, updated, or deleted.
