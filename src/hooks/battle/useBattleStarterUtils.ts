
import { Pokemon } from "@/services/pokemon";

export const shuffleArray = (array: Pokemon[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getRandomCrossGenerationPokemon = (pool: Pokemon[], count: number, excludeIds: Set<number>): Pokemon[] => {
  // For small pools or initial battles, use simple random selection
  if (pool.length < 100) {
    const available = pool.filter(p => !excludeIds.has(p.id));
    return shuffleArray(available).slice(0, count);
  }

  // For larger pools, use the full cross-generation logic
  const pokemonByGeneration = new Map<number, Pokemon[]>();
  pool.forEach(p => {
    if (excludeIds.has(p.id)) return;
    
    let gen = 1;
    if (p.id <= 151) gen = 1;
    else if (p.id <= 251) gen = 2;
    else if (p.id <= 386) gen = 3;
    else if (p.id <= 493) gen = 4;
    else if (p.id <= 649) gen = 5;
    else if (p.id <= 721) gen = 6;
    else if (p.id <= 809) gen = 7;
    else if (p.id <= 905) gen = 8;
    else gen = 9;
    
    if (!pokemonByGeneration.has(gen)) {
      pokemonByGeneration.set(gen, []);
    }
    pokemonByGeneration.get(gen)!.push(p);
  });

  const result: Pokemon[] = [];
  const availableGenerations = Array.from(pokemonByGeneration.keys()).filter(gen => 
    pokemonByGeneration.get(gen)!.length > 0
  );
  
  // Try to pick from different generations when possible
  for (let i = 0; i < count && result.length < count; i++) {
    if (availableGenerations.length === 0) break;
    
    const randomGen = availableGenerations[Math.floor(Math.random() * availableGenerations.length)];
    const genPokemon = pokemonByGeneration.get(randomGen)!;
    
    if (genPokemon.length > 0) {
      const randomIndex = Math.floor(Math.random() * genPokemon.length);
      const selectedPokemon = genPokemon.splice(randomIndex, 1)[0];
      result.push(selectedPokemon);
      
      // Remove generation from available if empty
      if (genPokemon.length === 0) {
        const genIndex = availableGenerations.indexOf(randomGen);
        availableGenerations.splice(genIndex, 1);
      }
    }
  }
  
  // If we still need more Pokemon, fill from any available
  if (result.length < count) {
    const remaining = pool.filter(p => 
      !excludeIds.has(p.id) && !result.some(r => r.id === p.id)
    );
    const shuffledRemaining = shuffleArray(remaining);
    result.push(...shuffledRemaining.slice(0, count - result.length));
  }
  
  return result;
};
