# Firestore Collections

This document describes the main Cloud Firestore collections used by StudentHub.

## users

Stores student and admin profiles.

Fields:

- `uid`
- `fullName`
- `email`
- `course`
- `college`
- `avatar`
- `reputation`
- `role`
- `totalUploads`
- `totalDownloads`
- `createdAt`
- `updatedAt`

## resources

Stores uploaded study resources.

Fields:

- `title`
- `description`
- `category`
- `price`
- `ownerId`
- `ownerName`
- `ownerEmail`
- `fileName`
- `status`
- `approved`
- `averageRating`
- `reviewCount`
- `downloadCount`
- `purchaseCount`
- `createdAt`
- `updatedAt`

## reviews

Stores resource reviews and ratings.

Fields:

- `resourceId`
- `userId`
- `userName`
- `rating`
- `review`
- `createdAt`
- `updatedAt`

## comments

Stores discussion comments under resources.

Fields:

- `resourceId`
- `userId`
- `userName`
- `message`
- `createdAt`
- `updatedAt`

## favorites

Stores saved resources for users.

Fields:

- `userId`
- `resourceId`
- `createdAt`

## libraries

Stores resources that a user has downloaded or purchased.

Fields:

- `userId`
- `resourceId`
- `title`
- `description`
- `category`
- `action`
- `ownerId`
- `ownerName`
- `createdAt`

## follows

Stores follow relationships between users.

Fields:

- `followerId`
- `followingId`
- `createdAt`

## conversations

Stores private messaging conversations.

Fields:

- `conversationKey`
- `participantIds`
- `lastMessage`
- `lastMessageAt`
- `typing`
- `typingUpdatedAt`
- `createdAt`
- `updatedAt`

## messages

Stores individual chat messages.

Fields:

- `conversationId`
- `senderId`
- `receiverId`
- `text`
- `read`
- `createdAt`

## notifications

Stores system and user notifications.

Fields:

- `userId`
- `title`
- `message`
- `type`
- `read`
- `createdAt`

## achievements

Stores earned user achievements.

Fields:

- `userId`
- `key`
- `title`
- `description`
- `icon`
- `earnedAt`

## activities

Stores dashboard activity feed events.

Fields:

- `userId`
- `type`
- `title`
- `description`
- `icon`
- `resourceId`
- `ownerId`
- `ownerName`
- `read`
- `createdAt`
