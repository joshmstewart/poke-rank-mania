
import { TCGApiResponse, TCGCard } from './types';
import { selectDiverseCards } from './sorting';

// Blocklist of specific card IDs that show card backs or are problematic
const BLOCKED_CARD_IDS = new Set([
  'svp-102', // Oddish card that shows back of card
]);

// Function to detect if a card is likely showing the back/reverse side
const isCardBack = (card: TCGCard): boolean => {
  // Check if card is in our explicit blocklist
  if (BLOCKED_CARD_IDS.has(card.id)) {
    console.log(`🚫 [TCG_FILTER] Blocking card ${card.id} (${card.name}) - in blocklist`);
    return true;
  }

  // Check for card back indicators in the image URL
  const imageUrl = card.images?.large || '';
  const cardBackIndicators = [
    '_back',
    'back_',
    'reverse',
    'cardback'
  ];
  
  if (cardBackIndicators.some(indicator => imageUrl.toLowerCase().includes(indicator))) {
    console.log(`🚫 [TCG_FILTER] Blocking card ${card.id} (${card.name}) - detected card back in URL`);
    return true;
  }

  // Additional checks for card backs (cards without proper Pokemon data)
  if (!card.hp && !card.attacks && !card.types && card.supertype === 'Pokémon') {
    console.log(`🚫 [TCG_FILTER] Blocking card ${card.id} (${card.name}) - missing Pokemon data, likely card back`);
    return true;
  }

  return false;
};

export const fetchTCGCards = async (pokemonName: string): Promise<{ firstCard: TCGCard | null; secondCard: TCGCard | null }> => {
  // Clean the Pokemon name for API search (remove hyphens, special characters)
  let searchName = pokemonName
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Special handling for Mega Pokemon - search for M version instead
  if (searchName.includes('mega ')) {
    // Extract the base Pokemon name (everything after 'mega ')
    const baseName = searchName.replace(/mega\s+/, '').trim();
    searchName = `M ${baseName}-EX`;
    console.log(`🔥 [TCG_MEGA] Detected Mega Pokemon, searching for M version: "${searchName}"`);
  }

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

  // Filter out card backs and blocked cards
  const filteredCards = data.data.filter(card => {
    const isBlocked = isCardBack(card);
    if (isBlocked) {
      console.log(`🚫 [TCG_FILTER] Filtered out card: ${card.id} (${card.name})`);
    }
    return !isBlocked;
  });

  console.log(`🃏 [TCG_FILTER] Filtered ${data.data.length - filteredCards.length} cards, ${filteredCards.length} remaining`);

  // Special detailed logging for specific Pokemon to analyze name forms
  const specialPokemon = ['charizard', 'mewtwo', 'pikachu', 'squirtle', 'charmander'];
  const matchedPokemon = specialPokemon.find(p => searchName.toLowerCase().includes(p));
  
  if (matchedPokemon) {
    const pokemonType = matchedPokemon.toUpperCase();
    const emojiMap: { [key: string]: string } = {
      'charizard': '🔥',
      'mewtwo': '🧬',
      'pikachu': '⚡',
      'squirtle': '💧',
      'charmander': '🦎'
    };
    const emoji = emojiMap[matchedPokemon];
    
    console.log(`${emoji} [${pokemonType}_TCG_ANALYSIS] Found ${filteredCards.length} ${pokemonType} cards after filtering:`);
    filteredCards.forEach((card, index) => {
      console.log(`${emoji} [${pokemonType}_TCG_CARD_${index + 1}] Name: "${card.name}" | Set: ${card.set.name} | Rarity: ${card.rarity} | Supertype: ${card.supertype} | Subtypes: ${card.subtypes?.join(', ') || 'none'}`);
    });
    
    // Group by unique names to see all variations
    const uniqueNames = [...new Set(filteredCards.map(card => card.name))];
    console.log(`${emoji} [${pokemonType}_TCG_UNIQUE_NAMES] ${uniqueNames.length} unique ${pokemonType} card names found:`, uniqueNames);
    
    // Look specifically for Mega patterns
    const megaCards = filteredCards.filter(card => card.name.toLowerCase().includes('mega'));
    if (megaCards.length > 0) {
      console.log(`${emoji} [${pokemonType}_TCG_MEGA_FOUND] Found ${megaCards.length} Mega cards:`, megaCards.map(card => card.name));
    } else {
      console.log(`${emoji} [${pokemonType}_TCG_MEGA_NONE] No Mega cards found in this search`);
    }
  }

  if (filteredCards && filteredCards.length > 0) {
    // Use new diverse selection logic on filtered cards
    const { firstCard, secondCard } = selectDiverseCards(filteredCards);
    
    console.log(`🃏 [TCG_RARITY] Available rarities for ${pokemonName}:`, 
      filteredCards.map(card => card.rarity).filter(Boolean)
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

  console.log(`🃏 [TCG_API] No valid TCG cards found for ${pokemonName} after filtering, using fallback`);
  return { firstCard: null, secondCard: null };
};
