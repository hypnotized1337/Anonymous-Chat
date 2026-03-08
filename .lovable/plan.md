

## Plan: Improved Reaction Picker, Better Emoji Selection & Notification Batching

### 1. Revamped Reaction Picker with Search

**File:** `src/components/chat/ReactionPicker.tsx`

Replace the current random emoji categories with a properly organized picker:
- **Quick reactions row** stays (✓ ✗ ⚡ 👁 🔥) — these are the app's signature reactions
- **"Frequently Used" section** at top of expanded picker showing the most commonly used emojis across chat apps: 👍 ❤️ 😂 😭 💀 🔥 💯 😍 🙏 👀 😤 🥺
- **Search input** at top of the popover — filters all emojis by name using a simple keyword map (e.g. typing "laugh" shows 😂😆🤣, typing "heart" shows ❤️💜💚 etc.)
- **Curated categories** (only when not searching): Popular, Faces, Gestures, Hearts, Symbols — with better emoji selection that people actually use
- Store a simple emoji-to-keywords map as a const for search matching
- Slightly larger popover (w-64) with better spacing

### 2. Notification Batching / Throttling

**File:** `src/hooks/use-chat.ts`

Add notification coalescing when messages come in rapidly while tab is hidden:
- Track `pendingNotifCount` ref and a `notifTimeoutRef` 
- On first incoming message while hidden: show notification immediately, start a 3-second cooldown window
- During cooldown: increment `pendingNotifCount` instead of firing individual notifications
- When cooldown expires: if pendingCount > 0, show ONE summary notification: `"+ {count} more messages in {roomCode}"`
- Reset on tab focus

Logic:
```
if (notifCooldownRef.current) {
  pendingNotifCount.current++;
} else {
  // show individual notification
  notifCooldownRef.current = setTimeout(() => {
    if (pendingNotifCount.current > 0) {
      new Notification(roomCode, { body: `+ ${pendingNotifCount.current} more messages` });
      pendingNotifCount.current = 0;
    }
    notifCooldownRef.current = null;
  }, 3000);
}
```

### 3. Fix duplicate `else if (msg.replyTo)` 

**File:** `src/hooks/use-chat.ts` (line 241-242) — there's a duplicated condition, will clean that up.

### Summary

| File | Change |
|---|---|
| `src/components/chat/ReactionPicker.tsx` | Full rewrite: search input, frequently-used section, keyword-based search, curated categories |
| `src/hooks/use-chat.ts` | Notification batching with 3s cooldown window; fix duplicate replyTo condition |

