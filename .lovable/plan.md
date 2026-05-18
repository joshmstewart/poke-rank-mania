# Why the Manual page is still laggy

## Context Log (memories checked)
- `mem://architecture/dnd-system` — strict `available-{id}` / `ranked-{id}` IDs, single `DndContext`, `useSortable` for ranked, `useDraggable` for available. Must keep contract.
- `mem://performance/grid-virtualization` — CSS-based virtualization is allowed but **must preserve dnd-kit collision detection**.
- `mem://style/design-tokens-and-layout` — semantic Tailwind tokens only, sprite scaling rules.
- Project knowledge: ID helpers `rankedId`/`availableId`, single `DndContext`, no nested contexts.

## Root cause (the one that actually matters)

The Available panel mounts **every Pokémon in the selected generation set as a fully-hydrated React component** — not just visible ones. With "All Generations" that's ~1,025 cards. Each card runs:

- `useDraggable(...)` — registers a node + listeners with dnd-kit's context
- `useCloudPendingBattles()` — Zustand subscription
- `useLongPress(...)` — pointer handlers
- A Radix `<Dialog>` instance (closed, but still mounted in the tree)
- `usePokemonFlavorText` + `usePokemonTCGCard` hooks (gated on `isOpen`, but the hook calls still run)
- An `<img>` with `loading="lazy"`

`contentVisibility: auto` only skips **paint/layout** for off-screen cards. React still mounts the component, dnd-kit still tracks the draggable, Zustand still subscribes, and every re-render still walks all 1,100 fibers. That is the lag — not the drag-over math we already optimized.

Symptoms this explains:
- Initial mount of /manual is slow.
- Dragging is laggy because dnd-kit's internal `DndMonitor` and context updates fan out to ~1,100 subscribed draggables on every state transition (drag start, drag over target change, drag end).
- Toggling a generation or adding a card to rankings rebuilds the `enhancedAvailablePokemon` array → new object identities → 1,100 cards reconcile.

## Secondary contributors (smaller, but real)

1. **`React.memo(DraggablePokemonMilestoneCard)` uses default shallow compare.** `enhancedAvailablePokemon` is rebuilt every time `localRankings` changes, producing fresh `pokemon` object identities, so the memo never hits during ranking edits.
2. **Per-card `useCloudPendingBattles()`.** Even with selectors, every card subscribes to the store. 1,100 subscribers re-check on any pending-battle write.
3. **Per-card Radix `<Dialog>`.** Each card mounts a Dialog root (state, context, portal hooks). Cheap individually, expensive ×1,100.
4. **`closestCenter` over the whole ranked grid every pointer move.** Fine for ~50, costly when the user has hundreds ranked.
5. **Logging in hot paths.** `RankingGrid.tsx` still has `console.log` on every render; `DragDropGrid` re-renders on every drag-over because the layout owner's `insertionPreviewIndex` state lives above it.

## Plan

### 1. Virtualize the Available list (the only fix that removes the 1,100-mount problem)
Use **windowed rendering** (TanStack Virtual or `react-window`) inside `EnhancedAvailablePokemonContent.tsx`:

- Render generation headers always (cheap), but only mount Pokémon cards that are within ~2 viewport heights of the scroll position.
- Off-screen cards become a sized spacer `<div>` — no `useDraggable`, no Dialog, no Zustand subscription.
- Preserve the dnd-kit contract: cards in the window keep the exact `availableId(dex)` and `data.type: "available-pokemon"` they have today. Dragging an off-screen card isn't a use case (you can't grab what you can't see).
- Keep `contentVisibility: auto` as a secondary skip for cards that briefly enter/exit the window.
- Maintain `mem://performance/grid-virtualization`: virtualize only the available list; do **not** virtualize ranked cards (collision detection must remain accurate there).

Expected impact: drops live `useDraggable` count from ~1,100 to ~30–60. This is the dominant win.

### 2. Stabilize Pokémon object identity
In the source that builds `enhancedAvailablePokemon` (search the call site that adds the `isRanked`/`currentRank` overlay), memoize per-id so an unrelated rank change doesn't mint a new object for every Pokémon:

```ts
const overlay = useMemo(() => {
  const rankedById = new Map(localRankings.map((p, i) => [p.id, i + 1]));
  return availablePokemon.map(p => {
    const rank = rankedById.get(p.id);
    return rank ? { ...p, isRanked: true, currentRank: rank } : p; // reuse identity when not ranked
  });
}, [availablePokemon, localRankings]);
```
Then add a custom comparator to the existing `React.memo` on `DraggablePokemonMilestoneCard` that compares `pokemon.id`, `isRanked`, `currentRank`, `isPending`, `index`, `context`.

### 3. Lift the per-card store subscription
Replace per-card `useCloudPendingBattles()` with a single subscription at the section level that passes a `Set<number>` down. Each card gets a plain `isPending` boolean prop — no Zustand subscription, no re-render storm on store writes.

### 4. Lazy-mount the info Dialog
Don't render `<Dialog>` until the user actually opens the card (gate the entire Dialog JSX behind the local `isOpen` / hover state, or on first interaction). This removes 1,100 Radix Dialog roots from the tree even before virtualization lands.

### 5. Cleanup hot paths
- Delete the two `console.log`s at the top of `RankingGrid.tsx`.
- Memoize `DragDropGrid` so it doesn't reconcile on every drag-over tick (its only changing prop is `insertionPreviewIndex`).
- Confirm `handleDragOver`'s rAF gate (already in place) doesn't flush state when `insertion` is unchanged (already guarded).

### 6. Optional: switch ranked-grid collision to `closestCorners` only when the dragged item is from `available-`
Cheaper rect math during cross-list drags. Only worth it if step 1 doesn't fully resolve the lag.

## Files to touch
- `src/components/ranking/EnhancedAvailablePokemonContent.tsx` — virtualization
- The hook that builds `enhancedAvailablePokemon` (likely `src/hooks/ranking/useEnhancedManualMode.ts` or similar — confirm during implementation) — identity-stable overlay
- `src/components/battle/DraggablePokemonMilestoneCard.tsx` — custom memo comparator, lazy Dialog, accept `isPending` as prop, drop `useCloudPendingBattles`
- `src/components/ranking/EnhancedAvailablePokemonSection.tsx` — subscribe once, pass `pendingIds` down
- `src/components/ranking/RankingGrid.tsx` — remove logs
- `src/components/battle/DragDropGrid.tsx` — wrap in `React.memo`

## Order of operations
1. Step 5 (cleanup) — 5 min, immediate small win.
2. Step 4 (lazy Dialog) — 10 min, removes 1,100 Radix roots.
3. Step 3 (lift subscription) — 15 min.
4. Step 2 (identity-stable overlay + comparator) — 15 min.
5. Step 1 (virtualization) — main work, biggest win.
6. Re-measure with `browser--performance_profile`; only do step 6 if needed.
