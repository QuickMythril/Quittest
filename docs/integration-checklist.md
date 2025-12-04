# v0.0.2 Feature Integration Checklist

Use this list to track re-adding v0.0.2 functionality into main. Check items off as they’re implemented and verified. Ordered from simplest to most complex.

- [x] Clipboard robustness: log and fallback path before legacy copy attempt.
- [x] Hashtag description handling: length-safe hashtag normalization with truncation indicator in composer (`buildHashtagDescription` usage).
- [x] Follow UX polish: follow button loading/disabled state tied to `useIsFollowing` returning `{ isFollowing, isLoading }`.
- [x] Name existence UX: cached name-existence check, loading/not-found states on profile, and related atoms/utils.
- [x] Mention/reply metadata: hash and embed mentions/replies into publish/update descriptions for notification discovery.
- [x] Mentions: @-autocomplete/search in composer, styled mentions in contentEditable, clickable mentions in posts, and mention parsing in parent-post previews.
- [x] Notification sound: Web Audio chime utility and settings/test trigger.
- [ ] Notification storage plumbing: IndexedDB/localforage store for shown IDs and preferences; initialization at layout bootstrap.
- [ ] Notifications UI: `/notifications` route/page with tabs and settings; sidebar badge/nav; snackbar click-through.
- [ ] Notifications: polling followers/mentions/replies, unread tracking, persisted preferences (snackbar/sound), last-viewed timestamp, and snackbar popup.

## Notifications (polling, unread, persisted prefs)
- [ ] src/hooks/useNotifications.ts
- [x] src/state/global/notifications.ts
- [ ] src/utils/notificationTimestamp.ts
- [ ] src/utils/notificationStorageDB.ts
- [ ] src/hooks/useNotificationStorage.ts
- [ ] src/components/NotificationSnackbar.tsx

## Notifications UI (route, page, sidebar, snackbar click)
- [x] src/components/NotificationsPage.tsx
- [x] src/routes/Routes.tsx
- [ ] src/components/SocialApp.tsx
- [ ] src/components/Sidebar.tsx
- [ ] src/styles/Layout.tsx

## Mentions (composer + rendering)
- [x] src/components/NewPostInput.tsx
- [x] src/components/Post.tsx

## Mention/reply metadata embedding
- [x] src/utils/postQdn.ts

## Name existence UX
- [x] src/hooks/useNameExists.ts
- [x] src/state/global/nameValidation.ts
- [x] src/utils/nameValidation.ts
- [x] src/components/UserFeed.tsx

## Follow UX polish (loading state)
- [x] src/hooks/useIsFollowing.ts
- [x] src/components/UserFeed.tsx

## Hashtag description handling (truncation indicator)
- [x] src/utils/postQdn.ts
- [x] src/components/NewPostInput.tsx

## Notification storage plumbing
- [x] src/utils/notificationStorageDB.ts
- [x] src/hooks/useNotificationStorage.ts
- [x] src/styles/Layout.tsx

## Notification sound
- [x] src/utils/notificationSound.ts
- [ ] src/components/NotificationSnackbar.tsx
- [ ] src/components/NotificationsPage.tsx

## Clipboard robustness
- [x] src/utils/clipboard.ts
