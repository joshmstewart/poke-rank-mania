
import { TCGApiResponse, TCGCard } from './types';
import { selectDiverseCards } from './sorting';

export const fetchTCGCards = async (pokemonName: string): Promise<{ firstCard: TCGCard | null; secondCard: TCGCard | null }> => {
  // Clean the Pokemon name for API search (remove hyphens, special characters)
  let searchName = pokemonName
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Special handling for G-Max Pokemon - search for VMAX version instead
  if (searchName.includes('g max') || searchName.includes('gmax')) {
    // Extract the base Pokemon name (everything before 'g max' or 'gmax')
    const baseName = searchName.replace(/g\s*max\s*/, '').trim();
    searchName = `${baseName} vmax`;
    console.log(`🃏 [TCG_GMAX] Detected G-Max Pokemon, searching for VMAX version: "${searchName}"`);
  }

  console.log(`🃏 [TCG_API] Searching for TCG cards with name: "${searchName}"`);
  
  const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${searchName}"`);
  
  if (!response.ok) {
    throw new Error(`TCG API error: ${response.status} ${response.statusText}`);
  }

  const data: TCGApiResponse = await response.json();
  console.log(`🃏 [TCG_API] Raw API response for ${pokemonName}:`, data);

  // Special detailed logging for Charizard to analyze name forms
  if (searchName.toLowerCase().includes('charizard')) {
    console.log(`🔥 [CHARIZARD_TCG_ANALYSIS] Found ${data.data.length} Charizard cards:`);
    data.data.forEach((card, index) => {
      console.log(`🔥 [CHARIZARD_TCG_CARD_${index + 1}] Name: "${card.name}" | Set: ${card.set.name} | Rarity: ${card.rarity} | Supertype: ${card.supertype} | Subtypes: ${card.subtypes?.join(', ') || 'none'}`);
    });
    
    // Group by unique names to see all variations
    const uniqueNames = [...new Set(data.data.map(card => card.name))];
    console.log(`🔥 [CHARIZARD_TCG_UNIQUE_NAMES] ${uniqueNames.length} unique Charizard card names found:`, uniqueNames);
  }

  if (data.data && data.data.length > 0) {
    // Use new diverse selection logic
    const { firstCard, secondCard } = selectDiverseCards(data.data);
    
    console.log(`🃏 [TCG_RARITY] Available rarities for ${pokemonName}:`, 
      data.data.map(card => card.rarity).filter(Boolean)
    );
    console.log(`🃏 [TCG_SELECTION] Selected first card with rarity: ${firstCard.rarity} from set: ${firstCard.set.name}`);
    console.log(`🃏 [TCG_SELECTION] Selected second card with rarity: ${secondCard?.rarity || 'none'} from set: ${secondCard?.set.name || 'none'}`);
    
    // Log metadata for decision-making
    console.log(`🃏 [TCG_METADATA] First card metadata for ${pokemonName}:`, {
      id: firstCard.id,
      name: firstCard.name,
      setName: firstCard.set.name,
      setSeries: firstCard.set.series,
      rarity: firstCard.rarity,
      supertype: firstCard.supertype,
      subtypes: firstCard.subtypes,
      hp: firstCard.hp,
      types: firstCard.types,
      hasLargeImage: !!firstCard.images?.large,
      imageUrl: firstCard.images?.large,
      flavorText: firstCard.flavorText,
      attacksCount: firstCard.attacks?.length || 0
    });

    return { firstCard, secondCard };
  }

  console.log(`🃏 [TCG_API] No TCG cards found for ${pokemonName}, using fallback`);
  return { firstCard: null, secondCard: null };
};
