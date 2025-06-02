
import { RankedPokemon, Pokemon } from "@/services/pokemon";

export const getPokemonBackgroundColor = (pokemon: RankedPokemon | Pokemon): string => {
  if (!pokemon.types || pokemon.types.length === 0) {
    return 'bg-gray-100';
  }
  
  let primaryType = 'unknown';
  
  if (typeof pokemon.types[0] === 'string') {
    primaryType = pokemon.types[0].toLowerCase();
  } else if (pokemon.types[0] && typeof pokemon.types[0] === 'object') {
    const typeObj = pokemon.types[0] as any;
    if (typeObj.type && typeObj.type.name) {
      primaryType = typeObj.type.name.toLowerCase();
    } else if (typeObj.name) {
      primaryType = typeObj.name.toLowerCase();
    }
  }
  
  // Medium saturation colors - more visible than -50 but not overwhelming
  const typeToColorMap: Record<string, string> = {
    'normal': 'bg-gray-100',
    'fighting': 'bg-red-100',
    'flying': 'bg-blue-100', 
    'poison': 'bg-purple-100',
    'ground': 'bg-yellow-100',
    'rock': 'bg-amber-100',
    'bug': 'bg-green-100',
    'ghost': 'bg-purple-100',
    'steel': 'bg-slate-100',
    'fire': 'bg-red-100',
    'water': 'bg-blue-100',
    'grass': 'bg-green-100',
    'electric': 'bg-yellow-100',
    'psychic': 'bg-pink-100',
    'ice': 'bg-cyan-100',
    'dragon': 'bg-indigo-100',
    'dark': 'bg-gray-200',
    'fairy': 'bg-pink-100'
  };
  
  return typeToColorMap[primaryType] || 'bg-gray-100';
};
