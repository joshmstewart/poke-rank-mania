
## Why it's laggy with <20 cards

The list is tiny, so this is not an algorithmic problem — it's a render/log-spam problem triggered every time `onDragMove` / `onDragOver` fires (which is on every mouse move, ~60×/sec).

Two specific findings from the code and logs:

1. **368 `console.*` statements** in `src/components/ranking`, `src/components/battle`, `src/hooks/ranking`, and `src/stores/trueskillStore.ts`. Console output in DevTools is genuinely slow, and several of them stringify large objects (e.g. the full 15-item rankings array on every reorder, `[GMAX_ULTRA_DEBUG]` per-Pokémon, `[SYNC_AUDIT]` 🚨🚨🚨 emojis). The `[PURE_DND_START]` / `[PURE_DND_END]` logs alone aren't the problem, but the per-render and per-Pokémon ones are.
2. **Every `setInsertionPreviewIndex` call re-renders the whole layout**, which re-renders `EnhancedAvailablePokemonSection` *and* `RankingsSection`, which re-render every `DraggablePokemonMilestoneCard` (a heavy card with TCG image lookups). `SortablePokemonCard` and the milestone card are not memoized, and they receive fresh array props (`allRankedPokemon={displayRankings}`) on every render.

Combine those and a single drag generates dozens of re-renders × ~30 cards × heavy card body × hundreds of console writes per second.

## Plan

### 1. Confirm with a quick profile (no code changes yet)
- Run `browser--start_profiling`, perform one drag-over from Available → Rankings, `browser--stop_profiling`.
- Look for top self-time: expect to see `console.log`, `DraggablePokemonMilestoneCard` render, and `setInsertionPreviewIndex` reconcile work dominate.

This validates the hypothesis before we refactor.

### 2. Silence the hot-path logs
Strip / gate logs in the files hit on every drag move and every render:
- `src/hooks/ranking/useEnhancedRankingDragDrop.ts` (`[PURE_DND_START]`, `[PURE_DND_END]`)
- `src/hooks/ranking/usePokemonMovement.ts` (`[Move]`)
- `src/components/ranking/RankingUICore.tsx` and `EnhancedRankingLayout.tsx` (`[ENHANCED_RANKING_UI]`)
- `src/stores/trueskillStore.ts` (`[SYNC_AUDIT]` 🚨)
- `src/components/pokemon/*` (`[GMAX_ULTRA_DEBUG]`)
- `[REORDER_DEBUG]` chain in the reorder hook

Use a small `debug()` helper gated on `import.meta.env.DEV && localStorage.getItem('debug:dnd')` so we keep the ability to turn them back on without ripping them out, but they're off by default.

### 3. Memoize the card render path
- Wrap `SortablePokemonCard` and `DraggablePokemonMilestoneCard` in `React.memo` with a custom comparator that only checks `pokemon.id`, `index`, `isPending`, and `insertionPreviewIndex`-relevant props.
- Replace the `allRankedPokemon={displayRankings}` prop drilling on every card with a context (or just remove it from the cards that don't read it). That single prop is the main reason memo fails today — it's a fresh array reference on every parent render.
- In `DragDropGrid`, memoize the `items` array passed to `SortableContext`.

### 4. Make `onDragOver` cheap
- Keep the current snapshot-rect math (it's already O(n) over ≤20 rects — fine).
- Move the `setInsertionPreviewIndex` call behind `requestAnimationFrame` coalescing so multiple mousemove events in a frame produce at most one render.
- Keep the existing "skip set if equal" guard.

### 5. Re-profile
- Same drag, compare top self-time. Target: drag frame work ≤ 4 ms, no `console.*` in the top 10.

## Technical notes

- @dnd-kit fires `onDragOver` on every mousemove; React state updates inside it cascade to the whole `<DndContext>` subtree unless children are memoized.
- `React.memo` only helps if props are referentially stable — that's why the array-prop cleanup in step 3 has to happen alongside memoization.
- `console.log` in DevTools serializes its args synchronously on the main thread; with 15 cards × multiple render-time logs each, this alone can blow the 16 ms budget.
- No changes to drop/insertion behavior — purely render/log work.

## Files likely to change
- `src/hooks/ranking/useEnhancedRankingDragDrop.ts`
- `src/hooks/ranking/usePokemonMovement.ts`
- `src/components/ranking/RankingUICore.tsx`
- `src/components/ranking/EnhancedRankingLayout.tsx`
- `src/components/battle/SortablePokemonCard.tsx`
- `src/components/battle/DraggablePokemonMilestoneCard.tsx`
- `src/components/battle/DragDropGrid.tsx`
- `src/stores/trueskillStore.ts` (log gating only)
- new: `src/utils/debug.ts` (or extend the existing one) for the `debug()` gate

## Out of scope
- Algorithm/collision-detection changes
- Any change to drop targets, insertion math, or scoring
