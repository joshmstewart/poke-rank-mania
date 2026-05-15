# Why DnD on /manual is laggy — full breakdown

**Context Log (project memory consulted)**
- `mem://architecture/dnd-system` — single DndContext, strict `ranked-{id}` / `available-{id}` IDs, helpers in `@/utils/id`.
- `mem://performance/grid-virtualization` — CSS-based virtualization is required for large lists and must preserve dnd-kit collision detection. **The Available grid currently violates this rule.**
- `mem://style/design-tokens-and-layout` — semantic tokens only.
- Previous turn removed the per-render console.log loops from `usePokemonGrouping` (real win, but only one of many issues).

## Root causes, ranked by impact

### 1. Available list mounts ~1,100 fully-interactive cards (no real virtualization)
`EnhancedAvailablePokemonContent` renders every Pokémon in every expanded generation as a `<DraggablePokemonMilestoneCard>`. The wrapper uses `content-visibility: auto`, which skips paint/layout when offscreen but **does not skip React work**. So every card still:
- calls `useDraggable` → registers itself in dnd-kit's draggable registry
- calls `useTrueSkillStore()` (whole-store subscription, see #2)
- calls `useLongPress`, `useCloudPendingBattles`, plus 4 `useState` + refs
- pays for `closestCenter` collision detection on every pointer move

This is the single biggest source of lag and the direct violation of `mem://performance/grid-virtualization`.

### 2. `useCloudPendingBattles` subscribes to the **entire** TrueSkill store
```ts
const { ... } = useTrueSkillStore();   // no selector
```
Zustand without a selector re-renders the consumer on **any** store change. With ~1,100 cards each subscribed to the whole store, a single TrueSkill update fans out to 1,100 re-renders. During drag, the store gets touched (insertion, score recompute) and the whole grid thrashes.

### 3. `usePokemonGrouping`'s memo is invalidated on every render
`EnhancedAvailablePokemonSection` passes `isGenerationExpandedForDisplay` — a **fresh function every render** — into the hook. It's in the `useMemo` deps, so the 1,100-item grouping loop re-runs on every parent render, including every drag-over tick. Same problem with `loadingRef={React.createRef()}` (new ref per render).

### 4. `allRankedPokemon` prop identity changes during drag, busting `React.memo`
`DraggablePokemonMilestoneCard` is `React.memo`'d, but `EnhancedAvailablePokemonContent` passes `allRankedPokemon={allRankedPokemon}` (= `displayRankings`). The reference changes whenever rankings update, so all 1,100 memoized available cards re-render together.

### 5. `closestCenter` runs over ~1,150 draggables every pointer move
With every available + ranked card registered as a draggable, dnd-kit's default collision detection is O(n) per `mousemove`. We don't need available cards to be drop targets at all — they should be draggable-only with no droppable footprint, and collision detection should be scoped to the rankings panel.

### 6. `handleDragOver` fires on every pointer move and calls `setState` directly
There's a `rafRef` declared in `useEnhancedRankingDragDrop` but it's never used. Every pointer tick:
- runs the snapshot-rect loop (fine, snapshot is stable)
- calls `setInsertionPreviewIndex(...)` — even when memoized to same value, the call still triggers React's reconciliation pass on the whole `EnhancedRankingLayout` subtree (which then re-renders `EnhancedAvailablePokemonSection` for reasons #3 and #4).

### 7. Per-card hook overhead that should be lifted or lazy
Every available card eagerly mounts `useLongPress`, `usePokemonFlavorText` (gated by `isOpen` so cheap, OK), `usePokemonTCGCard` (also gated, OK), plus dialog state. The Dialog tree is built but only opens on click — fine, but the long-press handler attaches pointer listeners to every card.

### 8. Minor extras
- `getPokemonBackgroundColor(pokemon)` and `pokemon.id.toString().padStart(...)` recompute every render — trivial individually, multiplied by 1,100.
- `dragProps = { ...attributes, ...listeners }` builds new objects every render (fine for a single card, but ×1,100 adds up during reconciliation).
- The cards-by-generation grids are re-created in a single inline loop in `renderContent()` (no useMemo). Whenever the parent re-renders, all generation `<div className="grid">` JSX is rebuilt.

---

## Fix plan (in order of impact / effort)

1. **Real virtualization for the Available list.** Use a windowed renderer (e.g. `@tanstack/react-virtual` per-generation row group, or a CSS row-virtualization variant per `mem://performance/grid-virtualization`) so only ~50–100 cards mount at a time. This single change should eliminate most of the lag.
2. **Replace whole-store subscriptions with selectors.** In `useCloudPendingBattles`, subscribe with `useTrueSkillStore(state => state.isPokemonPending(id))` etc., and accept `pokemonId` as an argument. Cards then only re-render when *their own* pending status flips.
3. **Stabilize props into `usePokemonGrouping`.**
   - Wrap `isGenerationExpandedForDisplay` in `useCallback` keyed on `expandedGenerations` + `generationsWithMatches` + `searchTerm`.
   - Drop `loadingRef={React.createRef()}` — use a stable `useRef` or remove if unused.
4. **Stop passing `allRankedPokemon` down to every card.** It isn't used inside the card at all (verify) — remove the prop. If it is used, replace with a selector hook reading from the store on demand.
5. **Scope dnd-kit collision detection.** Use a custom collision strategy (or `pointerWithin` + a filter on `droppableContainers`) that only considers ranked cards + the rankings-drop-zone. Available cards don't need to be droppables.
6. **Throttle `handleDragOver`** through the existing `rafRef` so we run at most once per animation frame.
7. **Memoize per-generation grid blocks** inside `EnhancedAvailablePokemonContent` so unrelated generations don't rebuild when one of them changes expansion.
8. **Drop the remaining heavy `[PURE_DND_*]` console.logs** in the drag hook; they fire every drag and serialize objects.

## Technical notes

- Touching the dnd-kit collision strategy must respect the `mem://architecture/dnd-system` ID prefix contract — we filter droppables by `id.startsWith('ranked-')` plus the `rankings-drop-zone` id. No data-shape changes.
- Switching `useCloudPendingBattles` to selectors is a contained refactor: the public API (`isPokemonPending`, `addPendingPokemon`, etc.) stays the same; only the internal subscription changes. Components that need *all* pending IDs (e.g. `ModeSwitcher`) keep a separate selector.
- Virtualization must keep `data-ranked-id` / dnd-kit IDs intact for cards that *are* mounted; offscreen cards being absent is fine because we only collide against the rankings panel after fix #5.
- No schema or backend changes; all fixes are client-side React/Zustand/dnd-kit.

Want me to implement these in this order, or jump straight to #1 + #2 (highest impact) first?