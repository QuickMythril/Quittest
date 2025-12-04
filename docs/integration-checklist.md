# v0.0.2 Feature Integration Checklist

Use this list to track re-adding v0.0.2 functionality into main. Check items off as they’re implemented and verified. Ordered from simplest to most complex.

- [x] Clipboard robustness: log and fallback path before legacy copy attempt.
- [ ] Hashtag description handling: length-safe hashtag normalization with truncation indicator in composer (`buildHashtagDescription` usage).
- [ ] Follow UX polish: follow button loading/disabled state tied to `useIsFollowing` returning `{ isFollowing, isLoading }`.
- [ ] Name existence UX: cached name-existence check, loading/not-found states on profile, and related atoms/utils.
- [ ] Mention/reply metadata: hash and embed mentions/replies into publish/update descriptions for notification discovery.
- [ ] Mentions: @-autocomplete/search in composer, styled mentions in contentEditable, clickable mentions in posts, and mention parsing in parent-post previews.
- [ ] Notification sound: Web Audio chime utility and settings/test trigger.
- [ ] Notification storage plumbing: IndexedDB/localforage store for shown IDs and preferences; initialization at layout bootstrap.
- [ ] Notifications UI: `/notifications` route/page with tabs and settings; sidebar badge/nav; snackbar click-through.
- [ ] Notifications: polling followers/mentions/replies, unread tracking, persisted preferences (snackbar/sound), last-viewed timestamp, and snackbar popup.

## Notifications (polling, unread, persisted prefs)
- [ ] src/hooks/useNotifications.ts
- [ ] src/state/global/notifications.ts
- [ ] src/utils/notificationTimestamp.ts
- [ ] src/utils/notificationStorageDB.ts
- [ ] src/hooks/useNotificationStorage.ts
- [ ] src/components/NotificationSnackbar.tsx

## Notifications UI (route, page, sidebar, snackbar click)
- [ ] src/components/NotificationsPage.tsx
- [ ] src/routes/Routes.tsx
- [ ] src/components/SocialApp.tsx
- [ ] src/components/Sidebar.tsx
- [ ] src/styles/Layout.tsx

## Mentions (composer + rendering)
- [ ] src/components/NewPostInput.tsx
- [ ] src/components/Post.tsx

## Mention/reply metadata embedding
- [ ] src/utils/postQdn.ts

## Name existence UX
- [ ] src/hooks/useNameExists.ts
- [ ] src/state/global/nameValidation.ts
- [ ] src/utils/nameValidation.ts
- [ ] src/components/UserFeed.tsx

## Follow UX polish (loading state)
- [ ] src/hooks/useIsFollowing.ts
- [ ] src/components/UserFeed.tsx

## Hashtag description handling (truncation indicator)
- [ ] src/utils/postQdn.ts
- [ ] src/components/NewPostInput.tsx

## Notification storage plumbing
- [ ] src/utils/notificationStorageDB.ts
- [ ] src/hooks/useNotificationStorage.ts
- [ ] src/styles/Layout.tsx

## Notification sound
- [ ] src/utils/notificationSound.ts
- [ ] src/components/NotificationSnackbar.tsx
- [ ] src/components/NotificationsPage.tsx

## Clipboard robustness
- [ ] src/utils/clipboard.ts
