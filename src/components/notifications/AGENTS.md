<!-- Parent: ../AGENTS.md -->

# src/components/notifications

Notification display components for user alerts and activity.

**Last updated:** 2026-03-17

## Components

### NotificationBadge.tsx
Unread notification count badge.

- Red dot or count number (0 = hidden)
- Positioned over bell icon in header
- Updates in real-time via RealtimeProvider
- Taps navigate to notifications screen

### NotificationItem.tsx
Single notification row with type-based styling.

- Type-specific icon (comment, claim, alert, match)
- Notification text (user action or system message)
- Timestamp relative to now
- Tap navigates to related context (post, claim, etc.)
- Soft-delete on swipe (mark as read/archived)

## Notification types

| Type | Icon | Context |
|------|------|---------|
| comment | 💬 | User commented on your post |
| claim | 🔍 | Someone claimed your post |
| alert | 🔔 | Lost alert match found |
| match | 👥 | Contact friend matched |

## Data flow

1. Push notification arrives (FCM/APNs)
2. NotificationProvider stores in state
3. NotificationBadge shows unread count
4. User taps badge, navigates to list
5. NotificationItem renders each notification
6. User taps notification, navigates to context
7. Notification marked as read

## Related

- `src/contexts/NotificationProvider.tsx` — push registration and handling
- `hooks/useNotifications.ts` — fetch and mutate notifications
- `src/app/(tabs)/notifications.tsx` — notifications screen
