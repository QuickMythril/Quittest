# Public/On-Demand Auth Flow — Implementation Plan

## 1) Remove global access gate ✅
- Updated `src/styles/Layout.tsx` to delete the `if (!hasProfile) return <CreateProfile />;` block so routes always render. Kept the loading guard for stale-name flashes.
- Next: verify nothing else navigates to `CreateProfile` as a top-level gate.

## 2) Make profile initialization non-blocking ✅
- Updated `src/hooks/useInitializeProfile.ts` to clear profile state only when the name actually changes and otherwise avoid unnecessary resets; still fetches/caches when `auth.name` exists and allows `profileData` to be `null` without gating.
- Next: spot-check consumers of `profileData`/`hasProfile` to ensure they tolerate `null`.

## 3) Public data path (feeds, posts, users) without auth ✅
- `identifierOperations` remains auth-free; no gating on auth for fetch paths.
- Added a shared error placeholder in `src/components/LoaderState.tsx` for `ERROR` status so feeds/search/user/post lists surface “Unable to load content” instead of blocking.
- Next: if we encounter specific fetches that demand auth, add unauth `qortalRequest` fallbacks, but current paths already operate without auth.

## 4) On-demand authentication for protected actions ✅
- Added `ensureAuthenticatedWithName` helper in `src/components/SocialApp.tsx` that prompts auth on demand, locks during an in-flight prompt, and toasts when a name is missing.
- Wired into post/reply/edit flows, like/unlike, repost, delete, follow/unfollow to keep buttons enabled but prompt when needed.
- Next: extend the same helper to profile creation once the form is relocated to the user profile page.

## 5) Auto-auth timing ✅
- `authenticateOnMount: true` remains in `src/AppWrapper.tsx`; with the profile gate removed, declining the prompt no longer blocks routing.
- No additional changes required beyond keeping the background prompt and allowing decline.

## 6) Move profile creation to the user’s own profile page ✅
- `CreateProfile` now supports an embedded mode (hides NameSwitcher/fixed layout, prompts auth on demand) and is rendered on the current user’s profile page when no profile is found.
- Added “No profile yet” + CTA in `src/components/UserFeed.tsx`; reuses existing creation logic.

## 7) UI/UX polish for unauthenticated mode ✅
- Added inline auth hint to posting inputs via `showAuthHint` prop (`NewPostInput`), wired into feed, reply input, and modal so users see they'll be prompted before posting.
- Likes/reposts/follows already prompt via on-demand auth; toasts still cover name-required flow.

## 8) Error handling and resilience ✅
- Added consistent error placeholders for list loaders across feed, user feed, post replies, and hashtag search (`LoaderState` error messaging used with custom text per page).
- Existing console.error logging retained for fetch/build-prefix failures.
- Extended error messaging to followers/following lists for consistency.

## 10) Automated tests (Vitest + Testing Library; Playwright later)
- ✅ Test harness setup: Added Vitest config (`vitest.config.ts`), global setup (`vitest.setup.ts`), and qapp-core/qortalRequest mocks under `__mocks__` to stub auth/lists/identifier operations, toast helpers, and balance; provides jsdom env and src/@ aliases.
- ✅ Auth helper coverage: Unit tests for the on-demand auth helper used in CreateProfile — ensures it skips auth when name/address present, prompts once when missing, handles missing name after auth, and calls publish/update on success.
- ✅ Protected actions: Tests for post flows to ensure on-demand auth short-circuits when name is missing and publishes when name/address are present (mocked Feed triggers handlers; postQdn publish mocked).
- ✅ CreateProfile embedded flow: Tests cover validation (bio required, balance threshold, name required), on-demand auth gating, and success path with publish/update and cache save mocked.
- ✅ Profile init hook: Tests cover cache hit, QDN fetch on miss, auth-missing path, and error path clearing profile while stopping loading.
- ✅ UI states: DOM tests for LoaderState error placeholder, posting auth hint via `showAuthHint`, and own-profile no-profile CTA showing embedded CreateProfile.
- ✅ Followers/Following lists: Tests for followers error/empty states and following error placeholder messaging.
- **(Optional) Playwright smoke set:** Later, add route-intercepted e2e covering public feed unauth, decline auth prompt, auth without name (name-required toast), auth with name posting/liking/following, and profile creation from own profile page.

## 9) Regression checks / QA
- Scenarios to verify:
  - Fresh load, decline auto-auth: feed/search/user/post pages still show data; protected actions prompt.
  - Fresh load, accept auth but no name: toasts on protected actions; public browsing works.
  - Auth with name: full functionality; creating a profile only from own profile page.
  - Name switch: no stale data flashes; no gating; profile fetch still works.
  - Network/QDN failure: placeholders render instead of blocking.
- Consider adding a small test harness or manual checklist; no automated tests exist, so document manual steps.
