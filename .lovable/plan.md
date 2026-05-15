## Context Log

Reviewed `src/hooks/battle/useBattleGeneration.ts` — the scheduler currently picks a strategy from a flat probability roll:

- Warm-up: while `ratedCount < N`, force Unranked battles.
- Ramp (N ≤ ratedCount < 2N): Unranked 40%, Top-N Refinement 30%, Bubble 15%, Bottom 15%.
- Steady state (ratedCount ≥ 2N): Unranked 15%, Top-N Refinement 50%, Bubble 20%, Bottom 15%.

Two issues match what you're seeing:
1. The unranked share is fixed by `ratedCount` vs `N`, not by **coverage of the filtered pool**. With a big filter (say 600 Pokémon) and only ~30 rated, we leave warm-up at 25 and immediately start spending 50% of battles refining the same Top N — even though 95% of the user's potential favourites have never appeared.
2. Nothing ever **retires** a Pokémon. The "back-burner" rule (`isBackBurnered`) only suppresses *primary* picks deep in the bottom (rank > N+50, σ low). It doesn't downweight refinement of someone we're already confident will never crack the Top N, and it doesn't free those slots for new blood.

## Proposal

### 1. Coverage-driven strategy mix

Replace the fixed warm-up/ramp/steady tiers with a continuous coverage ratio:

```text
coverage = ratedCount / filteredPoolSize        // 0.0 → 1.0
unrankedShare = clamp(1 - coverage, 0.15, 0.85) // explore-heavy when coverage low
```

Then split the remainder across the existing refinement strategies in their current ratio (Top-N : Bubble : Bottom ≈ 50 : 20 : 15 → ~59 : 24 : 17 of the non-unranked share). Concretely:

| Coverage | Unranked | Top-N Refine | Bubble | Bottom |
|---------:|---------:|-------------:|-------:|-------:|
| 5%       | 85%      | 9%           | 4%     | 2%     |
| 25%      | 75%      | 15%          | 6%     | 4%     |
| 50%      | 50%      | 30%          | 12%    | 8%     |
| 80%      | 20%      | 47%          | 19%    | 14%    |
| 100%     | 15%      | 50%          | 20%    | 15%    |

This naturally collapses to today's behaviour once the user has actually seen most of their pool, and stops over-refining when there are still huge unseen swaths.

If `unrankedPool.length === 0`, redistribute that share into Top-N Refinement (current fallback already does this implicitly).

### 2. "Locked-out" pruning

Add a helper:

```text
isLockedOutOfTopN(pokemon, rank, N, ratings):
  rating = ratings[pokemon.id]
  // 99% confident floor (mu - 2σ) is already worse than current Top-N cutoff
  topNFloorMu = ratings[rankedPokemon[N-1].id].mu
  return rank > N
      && rating.battleCount >= 5
      && rating.mu + 2 * rating.sigma < topNFloorMu
```

Apply it in three places:

- **Top-N refinement**: never picked (already restricted to Top N — no change, just makes the threshold meaningful).
- **Bubble Challenge**: exclude locked-out Pokémon from the inner/outer bubble challenger pool. Currently any rank N+1..N+50 with σ > 2.5 is fair game — that includes Pokémon we're already sure won't make it.
- **Bottom Confirmation**: skip entirely if the Pokémon is locked out of Top N *and* outside, say, the user's "interesting zone" (Top N×2). Reduces wasted battles deep in the tail.

Also stop generating "Upset vs Top N" inside Bottom Confirmation when the bottom Pokémon is locked out — it's pure noise.

### 3. Soft cap on consecutive refinement

Add a tiny memory in `useBattleGeneration` (a counter incremented when strategy ∈ {Top-N Refine, Bubble} and reset on Unranked). If it exceeds, e.g., 4 in a row while `coverage < 0.5`, force the next battle to Unranked. Cheap insurance against bad RNG streaks complaining users actually feel.

### 4. UI / config touch (optional, no behaviour change)

Surface coverage in the battle log line we already emit (`[TOP_N_SCHEDULER]`) so this is debuggable — `coverage=0.06, unrankedShare=0.84`.

## Files to change

- `src/hooks/battle/useBattleGeneration.ts`
  - Add `getFilteredPoolSize` (just `allPokemon.length`, since `allPokemon` is already filter-respecting upstream).
  - Replace the `forceUnranked` / `inRampWindow` / threshold block with the coverage formula.
  - Add `isLockedOutOfTopN` and use it to filter `challengerPool` in `generateBubbleChallengeBattle` and `eligibleBottom` in `generateBottomConfirmationBattle`.
  - Add the consecutive-refinement counter + override.

No other files need to change; `N` and `ratings` already flow through `useBattleProcessorGeneration` → `generateNewBattle`.

## Open questions

1. Should "locked-out" be tunable per user (e.g., a "focus depth" slider for Top N vs Top N×2 vs full), or just hard-coded at `2N`?
2. For coverage, should the denominator be the entire filtered `allPokemon`, or `allPokemon` minus Pokémon the user has explicitly frozen/excluded? Today freezeList isn't reaching this hook — easy to wire if you want.
3. Are you OK with Bottom Confirmation effectively going to ~0 at low coverage, or do you want a small floor (e.g. 5%) so we still occasionally sanity-check the tail?
