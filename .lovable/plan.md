## Why you saw only 12 Pokémon after 25 battles

The battle scheduler in `src/hooks/battle/useBattleGeneration.ts` rolls a strategy on every battle:

- 15% — introduce a brand-new (unranked) Pokémon
- 50% — refine the current Top N
- 20% — bubble challenge (still draws from already-ranked Pokémon)
- 15% — bottom confirmation (also already-ranked)

That distribution is fine once you have a healthy rated pool, but at the very start every "Top N refinement / bubble / bottom" roll just recycles the small group that has battled at least once. With only a 15% chance to introduce someone new, after ~25 battles you end up with roughly 10–12 unique Pokémon battling each other repeatedly — exactly what you saw.

The "recently used" filter (last 20) doesn't help because the entire rated pool fits inside that window, so the scheduler keeps falling back to the same faces.

## The fix

Make the scheduler "warm up" the rated pool before it starts refining it.

### Change 1 — Force unranked battles until the Top N is full

In `useBattleGeneration.ts`, before rolling `battleStrategyRoll`:

- Count rated Pokémon: `ratedCount = Object.keys(ratings).length`
- If `unrankedPool.length > 0 AND ratedCount < N` (default N = 25), skip the strategy roll and call `generateUnrankedBattle` directly.
- This guarantees the first ~25 battles introduce new Pokémon (each pair adds up to 2), so by the time refinement strategies kick in there's an actual Top 25 to refine.

### Change 2 — Soft ramp after the Top N is filled

Once `ratedCount >= N` but `ratedCount < N * 2` (e.g. 25–50 rated), bias the roll toward unranked:

- Bump unranked probability from 15% → 40% in this window
- Reduce Top-N refinement to 30% in this window
- Leave bubble/bottom at their current shares

After `ratedCount >= 50` the existing 15/50/20/15 distribution takes over.

### Change 3 — Tighten the "recently used" window early on

Right now `addToRecentlyUsed` keeps the last 20. While `ratedCount < 20`, cap the recent list at `Math.max(4, Math.floor(ratedCount / 2))` so we don't accidentally exclude every rated Pokémon and force the random fallback.

## Files touched

- `src/hooks/battle/useBattleGeneration.ts` — add the warm-up gate before the strategy roll, adjust probabilities based on `ratedCount`, and pass `ratedCount` into `addToRecentlyUsed` (or read it inside) to size the recent-window dynamically.

No other files, no schema, no DnD, no cache writes — pure battle-selection logic.

## Expected result

After 25 battles you should see roughly 25 unique Pokémon ranked (occasionally 23–27 due to unavoidable repeats from the unranked-vs-ranked fallback path), and the milestone screen will display a real Top 25 instead of "Showing 12 of 12".

## Out of scope (ask if you want these too)

- Backfilling your current session: the 12 already-rated Pokémon will stay rated; new battles will start expanding the pool from your next click. If you'd rather wipe and restart cleanly, say so and I'll add a one-time reset.
- Changing N from 25 to something else.
