
import { TCGApiResponse, TCGCard } from './types';
import { selectDiverseCards } from './sorting';
import { getCachedCards, setCachedCard } from './cache';

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

// Function to normalize names by removing accents and special characters
const normalizeForSearch = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9\s]/g, '') // Remove other special characters
    .trim();
};

// Function to create search name variations
const createSearchVariations = (pokemonName: string): string[] => {
  const variations = [];
  
  // Original name as-is
  variations.push(pokemonName.toLowerCase());
  
  // Normalized version (no accents)
  const normalized = normalizeForSearch(pokemonName);
  if (normalized !== pokemonName.toLowerCase()) {
    variations.push(normalized);
  }
  
  // Handle hyphens - try with spaces and without
  if (pokemonName.includes('-')) {
    variations.push(pokemonName.replace(/-/g, ' ').toLowerCase());
    variations.push(pokemonName.replace(/-/g, '').toLowerCase());
  }
  
  // Handle spaces - try with hyphens and without
  if (pokemonName.includes(' ')) {
    variations.push(pokemonName.replace(/\s+/g, '-').toLowerCase());
    variations.push(pokemonName.replace(/\s+/g, '').toLowerCase());
  }
  
  // Remove duplicates
  return [...new Set(variations)];
};

export const fetchTCGCards = async (pokemonName: string): Promise<{ firstCard: TCGCard | null; secondCard: TCGCard | null }> => {
  // Check database cache first
  const cachedResult = await getCachedCards(pokemonName);
  if (cachedResult.firstCard !== null) {
    console.log(`🃏 [TCG_CACHE] Using cached cards for ${pokemonName}`);
    return cachedResult;
  }

  console.log(`🃏 [TCG_API] Starting search for: "${pokemonName}"`);
  
  // Create name variations for search
  const nameVariations = createSearchVariations(pokemonName);
  console.log(`🃏 [TCG_VARIATIONS] Search variations for ${pokemonName}:`, nameVariations);

  // Clean the Pokemon name for API search (remove hyphens, special characters)
  let searchName = normalizeForSearch(pokemonName);

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

  console.log(`🃏 [TCG_API] Primary search name: "${searchName}"`);
  
  // Build comprehensive search strategies
  const searchStrategies = [];

  // Add strategies for each name variation
  for (const variation of nameVariations) {
    searchStrategies.push(`name:"${variation}"`);
    searchStrategies.push(`name:${variation.replace(/\s/g, '')}`); // No spaces
    searchStrategies.push(`name:${variation}`); // General search
  }

  // Special case for Ho-oh - try both formats
  if (pokemonName.toLowerCase() === 'ho-oh') {
    searchStrategies.push('name:"ho-oh"');
    searchStrategies.push('name:"Ho-Oh"');
    console.log(`🦅 [TCG_HO_OH] Special search strategies for Ho-oh added`);
  }
  
  // Special case for form Pokemon like "shaymin-land", "shaymin-sky"
  if (searchName.includes(' land') || searchName.includes(' sky')) {
    const baseName = searchName.replace(/ (land|sky)$/, '').trim();
    console.log(`🌿 [TCG_FORMS] Detected form Pokemon: ${pokemonName}, base name: ${baseName}`);
    
    // Try searching for the specific form first
    searchStrategies.push(`name:"${searchName}"`);
    searchStrategies.push(`name:"${baseName} land"`);
    searchStrategies.push(`name:"${baseName} sky"`);
    // Also try the base name to catch any general cards
    searchStrategies.push(`name:"${baseName}"`);
    searchStrategies.push(`name:${baseName}`);
  }

  console.log(`🔍 [TCG_STRATEGIES] Total search strategies for ${pokemonName}:`, searchStrategies.length);

  let allCards: TCGCard[] = [];
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [TCG_SEARCH] Trying search strategy: ${strategy}`);
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${strategy}`);
      
      if (!response.ok) {
        console.warn(`🚫 [TCG_API] Search strategy "${strategy}" failed: ${response.status}`);
        continue;
      }

      const data: TCGApiResponse = await response.json();
      console.log(`🃏 [TCG_API] Search strategy "${strategy}" returned ${data.data.length} cards`);
      
      if (data.data.length > 0) {
        allCards = [...allCards, ...data.data];
        // If we get good results, we can break early
        if (data.data.length >= 3) break;
      }
    } catch (error) {
      console.error(`🚫 [TCG_API] Error with search strategy "${strategy}":`, error);
    }
  }

  console.log(`🃏 [TCG_API] Combined search results for ${pokemonName}: ${allCards.length} total cards`);

  // Remove duplicates based on card ID
  const uniqueCards = allCards.filter((card, index, self) => 
    index === self.findIndex(c => c.id === card.id)
  );

  console.log(`🃏 [TCG_API] After removing duplicates: ${uniqueCards.length} unique cards`);

  // Filter out card backs and blocked cards
  const filteredCards = uniqueCards.filter(card => {
    const isBlocked = isCardBack(card);
    if (isBlocked) {
      console.log(`🚫 [TCG_FILTER] Filtered out card: ${card.id} (${card.name})`);
    }
    return !isBlocked;
  });

  console.log(`🃏 [TCG_FILTER] Filtered ${uniqueCards.length - filteredCards.length} cards, ${filteredCards.length} remaining`);

  // Special detailed logging for specific Pokemon to analyze name forms
  const specialPokemon = ['charizard', 'mewtwo', 'pikachu', 'squirtle', 'charmander', 'ho-oh', 'shaymin', 'flabebe', 'chien-pao'];
  const matchedPokemon = specialPokemon.find(p => pokemonName.toLowerCase().includes(p.replace('-', '')));
  
  if (matchedPokemon) {
    const pokemonType = matchedPokemon.toUpperCase();
    const emojiMap: { [key: string]: string } = {
      'charizard': '🔥',
      'mewtwo': '🧬',
      'pikachu': '⚡',
      'squirtle': '💧',
      'charmander': '🦎',
      'ho-oh': '🦅',
      'shaymin': '🌿',
      'flabebe': '🌸',
      'chien-pao': '❄️'
    };
    const emoji = emojiMap[matchedPokemon] || '🃏';
    
    console.log(`${emoji} [${pokemonType}_TCG_ANALYSIS] Found ${filteredCards.length} ${pokemonType} cards after filtering:`);
    filteredCards.forEach((card, index) => {
      console.log(`${emoji} [${pokemonType}_TCG_CARD_${index + 1}] Name: "${card.name}" | Set: ${card.set.name} | Rarity: ${card.rarity} | Supertype: ${card.supertype} | Subtypes: ${card.subtypes?.join(', ') || 'none'}`);
    });
    
    // Group by unique names to see all variations
    const uniqueNames = [...new Set(filteredCards.map(card => card.name))];
    console.log(`${emoji} [${pokemonType}_TCG_UNIQUE_NAMES] ${uniqueNames.length} unique ${pokemonType} card names found:`, uniqueNames);
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

    // Cache the results in the database
    await setCachedCard(pokemonName, firstCard, secondCard);

    return { firstCard, secondCard };
  }

  console.log(`🃏 [TCG_API] No valid TCG cards found for ${pokemonName} after all search strategies, using fallback`);
  
  // Cache the negative result to avoid repeated API calls
  await setCachedCard(pokemonName, null, null);
  
  return { firstCard: null, secondCard: null };
};
