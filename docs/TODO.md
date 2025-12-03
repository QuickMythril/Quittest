# Public/On-Demand Auth Flow — Implementation Plan

## 1) Remove global access gate ✅
- Updated `src/styles/Layout.tsx` to delete the `if (!hasProfile) return <CreateProfile />;` block so routes always render. Kept the loading guard for stale-name flashes.
- Next: verify nothing else navigates to `CreateProfile` as a top-level gate.

## 2) Make profile initialization non-blocking
- In `src/hooks/useInitializeProfile.ts`, stop using `hasProfile` as an access gate: remove the default reset to `false` that blocks UI. Keep fetching/caching when `auth.name` exists; allow `profileData` to be `null` without blocking.
- Audit components that consume `profileData`/`hasProfile` to tolerate `null` (e.g., avoid assumptions that cause crashes).

## 3) Public data path (feeds, posts, users) without auth
- Verify current fetches in `Feed`, `UserFeed`, `PostPage`, `SearchPage` work without `auth`; if any call requires auth context, add an unauth fallback that directly calls `qortalRequest` (`SEARCH_QDN_RESOURCES`/`FETCH_QDN_RESOURCE`) using the same identifiers/services.
- Keep using `identifierOperations` (it’s auth-free) to build prefixes. If it’s ever unavailable, define a minimal local helper using `buildSearchPrefix`/`buildLooseSearchPrefix` equivalents to avoid blocking.
- Add error placeholders for each page type: inline “Couldn’t load content / unavailable” states when fetch fails.

## 4) On-demand authentication for protected actions
- Keep buttons enabled. Wrap handlers for post/reply/edit/delete/like/repost/follow/unfollow/profile publish with:
  1) If `!auth.address || !auth.name`, `await auth.authenticateUser()`.
  2) If still `!auth.name`, toast “A Qortal name is required” and abort.
- Prevent double prompts: lock the handler while an auth attempt is in flight.

## 5) Auto-auth timing
- Leave `authenticateOnMount: true` in `AppWrapper`. Ensure decline does not trigger any gate or redirect.

## 6) Move profile creation to the user’s own profile page
- Remove standalone `CreateProfile` render path in `Layout`.
- Reuse `CreateProfile` form/logic inside the current user’s profile view (`/user/:auth.name`) when no profile data is found. Show a “No profile yet” message plus “Create profile” button there only.
- Ensure profile creation still checks balance/name and updates cache/state as before.

## 7) UI/UX polish for unauthenticated mode
- New post/reply inputs: show an auth prompt on action rather than disabling, but provide helper text/tooltips indicating auth + name is required to publish.
- Likes/reposts/follows: same prompt-on-click behavior; short helper text if unauthenticated.
- Name-required flow: just toast and abort when missing `auth.name`.

## 8) Error handling and resilience
- Add consistent placeholders for load failures on feed/user/post/search pages.
- Add logging (console) around fallback fetch failures for troubleshooting.

## 9) Regression checks / QA
- Scenarios to verify:
  - Fresh load, decline auto-auth: feed/search/user/post pages still show data; protected actions prompt.
  - Fresh load, accept auth but no name: toasts on protected actions; public browsing works.
  - Auth with name: full functionality; creating a profile only from own profile page.
  - Name switch: no stale data flashes; no gating; profile fetch still works.
  - Network/QDN failure: placeholders render instead of blocking.
- Consider adding a small test harness or manual checklist; no automated tests exist, so document manual steps.
