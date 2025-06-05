
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
  if (id.startsWith('ranking-position-')) {
    const positionIndex = parseInt(id.replace('ranking-position-', ''), 10);
    return { pokemonId: null, positionIndex: isNaN(positionIndex) ? null : positionIndex };
  }
  if (id.startsWith('ranking-')) {
    const pokemonId = parseInt(id.replace('ranking-', ''), 10);
    return { pokemonId: isNaN(pokemonId) ? null : pokemonId, positionIndex: null };
  }
  // Legacy numeric IDs
  const numeric = parseInt(id, 10);
  return { pokemonId: isNaN(numeric) ? null : numeric, positionIndex: null };
};
