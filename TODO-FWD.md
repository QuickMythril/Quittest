# Chat Forwarding Plan (Draft)

## Goal
Add a "Forward to chat" button on each post to share post content via chat to a user or a group.

## High-level flow
1. Add a forward/share-to-chat button on posts (alongside existing actions).
2. Open a small modal with two options: "Share to user" and "Share to group".
3. For user flow: allow typing a name/address with autocomplete against known names; select a recipient.
4. For group flow: show joined groups to pick from; optionally support search/filter.
5. Build a chat message payload from the post (text + attachments reference/URL) and send via chat API to the selected user or group.
6. Show success/error feedback; close modal on success.

## Key considerations to flesh out later
- Payload format: include post link (`qortal://APP/Quittest/post/{name}/{id}`) and snippet of text; decide whether to include media refs vs. inline links. Chat messages accept either `message` (string) or `fullMessageObject` (object or string). If only `message` is provided, Hub wraps it into a tiptap JSON doc (`messageText`, `images`, `repliedTo`, `version:3`). Supplying a string `fullMessageObject` is allowed and sent raw.
- Auth requirements: ensure sender is authenticated with a name; prompt if not.
- Rate/size limits: chat messages are limited to ~4000 bytes (Hub constant `MAX_SIZE_MESSAGE`). Keep payload lean; prefer link + short snippet to avoid JSON overhead.
- Encryption: direct chats are encrypted and require recipient pubkey on chain; groups send unencrypted (`isEncrypted:0`).
- Error states: recipient not found or lacks pubkey, group membership missing, send failures; retry/alerts.
- UI polish: loading indicators for search and send; disable send while in-flight.
- Tests: unit tests for modal logic and payload builder; integration test for send calls with mocks.

## Next steps (to expand later)
- Define component structure for the forward modal and wire into `PostWrapper` actions.
- Implement recipient search (names) and group list retrieval, both debounced.
- Implement message builder and chat send function (user vs. group targets).
- Add confirmations/toasts and error handling.
- Add tests and wiring into existing action bars.

## Detailed checklist (in order)

1) **Add forward action entry point** ✅
   - Add a "Forward to chat" button/icon to each post’s action bar.
   - Open a small modal with two options: Share to user / Share to group.

2) **Modal UI skeleton** ✅
   - Build the modal shell (title, close, content area, primary action disabled by default).
   - Option toggles for user vs. group; keep modal small.

3) **User flow – recipient search** ✅
   - Add a text input with debounce that searches names/addresses (reuse SEARCH_NAMES + optional address validation).
   - Show autocomplete list; allow selecting a recipient; store address/name.
   - Disable send until a recipient is selected.

4) **Group flow – group picker**
   - Fetch joined groups (list joined group IDs/names) and display as selectable options.
   - Add simple filter by name/ID; allow selecting one group.
   - Disable send until a group is selected.

5) **Message payload builder**
   - Build chat payload from post: include `qortal://APP/Quittest/post/{name}/{id}` + short text snippet.
   - Keep under ~4000 bytes; trim snippet as needed; prefer string `fullMessageObject` or compact object.
   - For user target: ensure `recipient`/`destinationAddress` set; for group: set `groupId`.

6) **Send integration**
   - Call `qortalRequest` with `SEND_CHAT_MESSAGE` using built payload.
   - Handle direct (encrypted) vs. group (unencrypted) paths implicitly; surface errors (no pubkey, size, balance).
   - Show loading state on send; close modal on success.

7) **Feedback and error states**
   - Toasts/snackbars for success/failure; inline error messages for missing selection or size overflow.
   - Retry affordance for failed sends.

8) **Tests**
   - Unit tests for payload builder sizing/truncation.
   - UI tests/mocks for recipient search and group picker selections.
   - Integration-style test for `SEND_CHAT_MESSAGE` call (mocked qortalRequest).

9) **Polish**
   - Ensure modal keyboard navigation works; close on Escape/click-outside.
   - Tooltips on icon/button; consistent styling with existing action buttons.
