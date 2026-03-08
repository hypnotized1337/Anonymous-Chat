

## Two Issues

**1. Misleading toast message**: When a user tries to create a room with password-protect ON but the room already has a password set by someone else, the toast says "ROOM IS LOCKED" — it should say the room name is already taken and password-protected.

**2. Stale passwords on inactive rooms**: When all users leave a room, the password cleanup (in `use-chat.ts` presence sync) may not fire reliably (e.g. browser crash, tab close). So a room can appear "locked" even though nobody is in it. A new user trying to use that room code gets blocked.

## Fix (single file: `src/components/JoinScreen.tsx`)

Refactor the `roomAlreadyHasPassword` branch (lines 65-89) to also check presence before deciding what to do:

**When `roomAlreadyHasPassword` is true:**
1. Check presence on `room:${roomName}` channel (same 2s timeout pattern already used below)
2. **If room has active users** → show toast: "ROOM ALREADY IN USE — This room name is taken and password-protected. Enter the password to join." Set `needsPassword = true`, `roomTaken = true` (red ring), hide the password-protect toggle.
3. **If room has NO active users** → the password is stale. Delete it via `room-password` `delete` action. Then proceed normally: if the user had password-protect ON, set their new password; if not, just join without password.

**Updated toast/error messaging:**
- Active + password-protected: "ROOM TAKEN" / "This room name is already in use and is password-protected. Enter the password to join."
- When user had password-protect toggle ON for an already-protected active room: same as above, plus a brief explanation: "Your password settings were ignored because this room already has a password."

This means the `needsPassword` password-entry label (line 299) stays as "This room is locked — enter password" which is fine for the actual entry step.

## Files Changed
- `src/components/JoinScreen.tsx` — refactor the `roomAlreadyHasPassword` branch to check presence, clean up stale passwords, and update toast messages

