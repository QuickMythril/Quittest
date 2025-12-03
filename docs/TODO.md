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
