# ADR-006: Use lightweight message replies instead of nested threads

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

Students need to answer a specific message without losing the chronological flow
of a direct or group conversation. Fully nested threads would introduce separate
message lists, unread state, navigation, notification rules, query patterns,
moderation behavior, and a more complex mobile interface.

StudentHub's current conversations are intended to remain easy to scan and use
on phones.

## Decision

A reply remains a normal message in the conversation timeline and stores a
validated, lightweight snapshot of its target:

```javascript
{
    (messageId, senderId, senderName, preview, type);
}
```

Only one reply target can be active in the composer. The message service stores
reply metadata with the new message. The original message is not nested below
the reply and is not duplicated.

Reply previews navigate to the loaded original message, center it, move focus,
and highlight it temporarily. If the message is not loaded, the navigation
controller exposes a callback for future pagination support.

Replies do not recursively embed the original message's reply metadata. This
keeps the stored snapshot bounded.

## Consequences

### Positive

- Conversations retain one chronological timeline.
- Existing message subscriptions and pagination remain usable.
- Reply rendering is compact on mobile.
- Deleted or unavailable original messages can degrade gracefully.
- Stored metadata is bounded and inexpensive to display.

### Trade-offs

- Long side discussions remain in the main conversation.
- Reply previews can become stale if the original message is edited.
- Navigating to an unloaded original requires pagination coordination.
- This model does not provide thread-specific unread counts or membership.

## Alternatives considered

### Discord-style nested threads

Threads support long side discussions but require a separate conversation model,
additional subscriptions, new notification semantics, and more complex mobile
navigation. That cost is not justified by StudentHub's current study-chat use
cases.

### Store only the original message ID

This avoids snapshot staleness but requires an additional read before a reply
preview can render and fails poorly when the original message is unavailable.

### Copy the complete original message

This makes rendering easy but duplicates unnecessary data, risks recursive
growth, and retains content that may later be deleted.
