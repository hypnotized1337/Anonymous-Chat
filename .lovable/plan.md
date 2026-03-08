

## Plan

### 1. Message History Sync on Rejoin

**Problem**: Messages are stored only in local state. When a user leaves and rejoins while others remain, they see an empty chat.

**Approach**: Use broadcast events to sync history peer-to-peer.

- When a user joins and the room already has users, broadcast a `request-history` event after presence sync confirms other users exist.
- Existing users listen for `request-history`. The **first user alphabetically** (to avoid duplicates) responds with a `history-sync` broadcast containing their current valid messages (filtered to those still within the 10-min window).
- The joining user receives `history-sync` and merges those messages into their state (deduplicating by ID, excluding their own join message which they already have).
- Add Zod schemas for the new events: `RequestHistorySchema` and `HistorySyncSchema` (array of `ChatMessageSchema`).
- The room-empty purge logic (line 429) stays as-is — when all users leave, messages are wiped, so there's nothing to sync.

**Files changed**: `src/hooks/use-chat.ts`

---

### 2. Video Viewer (mega.nz-inspired)

**Problem**: Videos uploaded as files only show as generic file attachments with no preview.

**Approach**: Create a `VideoInspector` component and detect video files for special treatment.

- **`src/components/chat/FileHelpers.ts`**: Add `isVideo()` helper function and video icon detection. Add video MIME types to `ACCEPTED_FILE_TYPES`.
- **`src/components/chat/VideoInspector.tsx`**: New component, styled like `FileInspector` but with:
  - A `<video>` element with controls for inline preview (no download required)
  - Metadata grid (size, type, uploaded date) matching FileInspector style
  - Download button
  - Monochrome grayscale filter on the video thumbnail matching the app's media style
  - Escape to close, backdrop blur overlay
- **`src/components/chat/VideoAttachment.tsx`**: New component for the in-bubble preview — shows a thumbnail frame from the video with a play icon overlay, clicking opens `VideoInspector`. Styled like `FileAttachment` but with a video preview.
- **`src/components/chat/MessageBubble.tsx`**: Add detection for video files — if `fileUrl` exists and MIME type is video, render `VideoAttachment` instead of `FileAttachment`.
- **`src/components/ChatArea.tsx`**: Add state and handler for the video inspector modal, pass it down to MessageBubble.
- **`src/hooks/use-chat.ts`**: Ensure video MIME types are handled in the upload flow (they already go through the generic file path).

