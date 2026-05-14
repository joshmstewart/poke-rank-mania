import type { RankedPokemon } from "@/services/pokemon";

/**
 * Export rankings as a downloadable JSON file.
 * Includes minimal user-facing fields plus TrueSkill score/confidence so the
 * export can be diffed or re-imported later.
 */
export const exportRankingsAsJson = (rankings: RankedPokemon[]): void => {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    count: rankings.length,
    rankings: rankings.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      name: p.name,
      score: typeof p.score === "number" ? Number(p.score.toFixed(4)) : null,
      confidence: typeof p.confidence === "number" ? Number(p.confidence.toFixed(2)) : null,
      battles: p.count ?? 0,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pokerank-rankings-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};