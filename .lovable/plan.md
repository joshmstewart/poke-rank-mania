
## Scope: touch devices only
Desktop hover behavior stays exactly as it is today. The long-press menu, the removal of always-visible buttons, and the persistent star indicator only kick in on coarse pointers (touch).

Detection: CSS media query `(pointer: coarse)` — Tailwind arbitrary variant `[@media(pointer:coarse)]:` — and a matching JS check (`window.matchMedia('(pointer: coarse)').matches`) for the long-press hook so we don't even attach pointer listeners on desktop.

## Interaction model

### Desktop (fine pointer) — unchanged
- Hover a card → star, info `i`, and `+` buttons appear in the corners (current behavior).
- Click each to act. Drag works as today.

### Touch (coarse pointer) — new
| Context           | Tap                          | Long-press (~500 ms)            | Drag                          |
|-------------------|------------------------------|---------------------------------|-------------------------------|
| Available (manual)| Add to rankings              | Menu: Info, Star/Unstar         | Drag to insert in rankings    |
| Ranked (manual)   | Open Info modal              | Menu: Info, Star/Unstar, Remove | Drag to reorder               |
| Battle Mode       | Pick as winner *(unchanged)* | n/a (skip in this pass)         | n/a                           |

Persistent visual on touch only: small filled yellow ★ in the **top-left corner only when starred**. Unstarred cards show no chrome.

First-visit hint on touch only: one dismissible toast — "Long-press a card for more options" — remembered in `localStorage`.

## Plan

### 1. New `useLongPress` hook (`src/hooks/useLongPress.ts`)
- Args: `{ onLongPress, onTap, threshold = 500, moveTolerance = 8 }`.
- Internally: `if (!matchMedia('(pointer: coarse)').matches) return {}` → returns no handlers on desktop, so desktop click/hover is untouched.
- On touch: pointer-down starts a timer; movement > tolerance or pointer-up before threshold cancels and fires `onTap`; threshold reached fires `onLongPress` and suppresses the trailing synthetic click.

### 2. New `<CardActionMenu />` (`src/components/battle/CardActionMenu.tsx`)
- shadcn `DropdownMenu`, controlled open state, anchored over the card.
- Items: **Info**, **Star** / **Unstar**, and in `ranked` context **Remove from rankings**.
- Only mounted when open, so memoized cards don't pay for it at rest.

### 3. Edit `DraggablePokemonMilestoneCard.tsx`
- Keep the existing hover-revealed star, info `i`, and `+` buttons exactly as they are — but wrap each in `[@media(pointer:hover)]:` so they only render/show on devices that hover. Practical pattern: leave the buttons in place but add `[@media(pointer:coarse)]:hidden` so they vanish on touch.
- Add `useLongPress` on the card root. On coarse pointers only, `onTap` = dispatch `add-pokemon-to-rankings` (available) or open info dialog (ranked); `onLongPress` = open `<CardActionMenu />`.
- Add the persistent ★ corner indicator gated by `[@media(pointer:coarse)]:` — invisible on desktop, visible-when-starred on touch.
- Use semantic tokens for all new styling (`bg-background/80`, `text-muted-foreground`, `border-border`).

### 4. Reconcile drag with long-press (touch only)
- `TouchSensor.activationConstraint.delay`: 100 → **250 ms**, `tolerance: 8`.
- `PointerSensor`: leave as is (desktop drag stays snappy).
- Long-press timer (500 ms) is longer than the touch drag delay (250 ms), so a moving finger starts a drag and cancels the long-press; a still hold for 500 ms fires the menu.
- If the menu opens, set a ref flag and bail out of `handleDragStart` for that gesture.

### 5. First-visit hint
- A toast on first manual-mode visit when `matchMedia('(pointer: coarse)').matches`. Persisted via `localStorage.setItem('long-press-hint-seen', '1')`. Desktop never sees it.

### 6. Verify
- Mobile preview (440×798): no buttons by default, ★ appears when starred, tap = add/info, long-press = menu, drag still works.
- Desktop preview: unchanged — hover still reveals the same star/info/+ buttons.

## Out of scope
- Long-press menu on the Battle Mode pick-winner card (different component path; happy to add as a follow-up).
- Swipe gestures, multi-select, bulk star.
- Any change to refinement queue logic, dnd math, or scoring.
- Any desktop visual change.

## Files to change
- `src/hooks/useLongPress.ts` *(new)*
- `src/components/battle/CardActionMenu.tsx` *(new)*
- `src/components/battle/DraggablePokemonMilestoneCard.tsx`
- `src/hooks/ranking/useEnhancedRankingDragDrop.ts` *(touch-sensor delay only)*

## Technical notes
- `[@media(pointer:coarse)]:` is Tailwind v3 arbitrary-variant syntax already supported.
- `DraggablePokemonMilestoneCard` stays `React.memo`'d; menu open state lives in the card so only the open card re-renders.
- The existing `add-pokemon-to-rankings` CustomEvent stays the single insertion path.
