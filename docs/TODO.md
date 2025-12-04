# Implementation Plans

## Minor improvements / open items
- Navigation bug investigation: changing the like/reply/repost count hooks to return `undefined` on load/error (and adding likeCount state) broke unauthenticated navigation. Revisit the count hook changes in small steps with guards to skip fetches when auth/identifier ops aren’t ready and ensure they don’t block routing when unauthenticated.
- Hashtag limits: Review the 2-tag limit; determine safe metadata length and raise limit (e.g., to 5) while keeping identifiers/search compatibility.
- Responsive layout: Audit sidebar/hide breakpoints and add a mini sidebar for small screens; optimize space usage on window resize.
- Chat forwarding: Add a “Forward to chat” action on posts to send as a direct message to a user or to a group chat selection, alongside the existing copy-link.
- Privacy: Add encrypted/private posts with audience selection: only self, specific user(s), or specific group(s), using QDN encryption and group key encryption as needed.
