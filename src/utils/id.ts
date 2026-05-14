/**
 * Drag-and-drop ID helpers.
 *
 * All draggable/sortable ids in PokeRank MUST be created with these helpers
 * so handleDragEnd can rely on the `available-` / `ranked-` prefix contract.
 *
 * @example
 *   rankedId(25)      // "ranked-25"
 *   availableId(6)    // "available-6"
 */

export const rankedId = (dex: number): string => `ranked-${dex}`;
export const availableId = (dex: number): string => `available-${dex}`;

export const isRankedId = (id: string | number): boolean =>
  typeof id === "string" && id.startsWith("ranked-");

export const isAvailableId = (id: string | number): boolean =>
  typeof id === "string" && id.startsWith("available-");

export const dexFromId = (id: string): number | null => {
  const match = /^(?:ranked|available)-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
};