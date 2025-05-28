
import { RankedPokemon, Pokemon } from "@/services/pokemon";

export const getPokemonBackgroundColor = (pokemon: RankedPokemon | Pokemon): string => {
  console.log(`🎨 COLOR DEBUG for ${pokemon.name}:`, {
    hasTypes: !!pokemon.types,
    typesArray: pokemon.types,
    typesLength: pokemon.types?.length || 0
  });

  if (!pokemon.types || pokemon.types.length === 0) {
    console.log(`❌ ${pokemon.name}: No types found, using gray-100`);
    return 'bg-gray-100';
  }
  
  let primaryType = 'unknown';
  
  if (typeof pokemon.types[0] === 'string') {
    primaryType = pokemon.types[0].toLowerCase();
    console.log(`✅ ${pokemon.name}: Direct string type: ${primaryType}`);
  } else if (pokemon.types[0] && typeof pokemon.types[0] === 'object') {
    const typeObj = pokemon.types[0] as any;
    if (typeObj.type && typeObj.type.name) {
      primaryType = typeObj.type.name.toLowerCase();
      console.log(`✅ ${pokemon.name}: Nested type.name: ${primaryType}`);
    } else if (typeObj.name) {
      primaryType = typeObj.name.toLowerCase();
      console.log(`✅ ${pokemon.name}: Direct name: ${primaryType}`);
    } else {
      console.log(`❌ ${pokemon.name}: Object type but no recognizable structure:`, typeObj);
    }
  } else {
    console.log(`❌ ${pokemon.name}: Unrecognized type structure:`, pokemon.types[0]);
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
  
  const finalColor = typeToColorMap[primaryType] || 'bg-gray-100';
  console.log(`🎨 ${pokemon.name}: Final color for type '${primaryType}': ${finalColor}`);
  return finalColor;
};
