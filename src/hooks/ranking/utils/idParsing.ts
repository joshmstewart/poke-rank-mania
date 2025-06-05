
export interface ParsedId {
  pokemonId: number | null;
  positionIndex: number | null;
}

// Enhanced parseId to handle all ID patterns including empty slots
export const parseId = (id: string): ParsedId => {
  if (id.startsWith('available-')) {
    const pokemonId = parseInt(id.replace('available-', ''), 10);
    return { pokemonId: isNaN(pokemonId) ? null : pokemonId, positionIndex: null };
  }

  const rankingMatch = id.match(/^ranking-(?:position-)?(\d+)$/);
  if (rankingMatch) {
    const value = parseInt(rankingMatch[1], 10);
    if (id.includes('position-')) {
      return { pokemonId: null, positionIndex: isNaN(value) ? null : value };
    }
    return { pokemonId: isNaN(value) ? null : value, positionIndex: null };
  }

  // Legacy numeric IDs
  const numeric = parseInt(id, 10);
  return { pokemonId: isNaN(numeric) ? null : numeric, positionIndex: null };
};
