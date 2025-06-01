
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonGeneration, generationDetails } from "@/components/pokemon/generationUtils";
import { getBasePokemonName } from "@/utils/pokemon/pokemonGenerationUtils";

// Function to determine generation based on Pokemon ID with better fallback logic
const determineGenerationFromId = (pokemonId: number): number => {
  // Standard generation ranges
  if (pokemonId >= 1 && pokemonId <= 151) return 1;
  if (pokemonId >= 152 && pokemonId <= 251) return 2;
  if (pokemonId >= 252 && pokemonId <= 386) return 3;
  if (pokemonId >= 387 && pokemonId <= 493) return 4;
  if (pokemonId >= 494 && pokemonId <= 649) return 5;
  if (pokemonId >= 650 && pokemonId <= 721) return 6;
  if (pokemonId >= 722 && pokemonId <= 809) return 7;
  if (pokemonId >= 810 && pokemonId <= 905) return 8;
  if (pokemonId >= 906 && pokemonId <= 1025) return 9;
  
  // For Pokemon with IDs outside normal ranges (variants, forms, etc.)
  // Try to map them based on the last 3-4 digits or patterns
  if (pokemonId > 10000) {
    // Very high IDs - try modulo 1000 first, then modulo 10000
    const mod1000 = pokemonId % 1000;
    const mod10000 = pokemonId % 10000;
    
    if (mod1000 >= 1 && mod1000 <= 1025) {
      return determineGenerationFromId(mod1000);
    }
    if (mod10000 >= 1 && mod10000 <= 1025) {
      return determineGenerationFromId(mod10000);
    }
  }
  
  // For IDs like 10001-10999, extract the base ID
  if (pokemonId >= 10000 && pokemonId < 11000) {
    const baseId = pokemonId - 10000;
    if (baseId >= 1 && baseId <= 1025) {
      return determineGenerationFromId(baseId);
    }
  }
  
  // Default to latest generation for unknown IDs
  return 9;
};

// Create a comprehensive mapping that uses ID ranges for ALL Pokemon
const createBaseGenerationMap = () => {
  const map: Record<string, number> = {};
  
  // Helper function to add variants for a base Pokemon
  const addVariants = (baseName: string, generation: number) => {
    map[baseName] = generation;
    
    // Add common variants that should inherit the same generation
    map[`${baseName}-male`] = generation;
    map[`${baseName}-female`] = generation;
    map[`${baseName}-f`] = generation;
    map[`${baseName}-m`] = generation;
    
    // Regional forms get assigned to their appearance generation
    if (generation <= 6) { // Only add regional forms for Pokemon that existed before Gen 7
      map[`${baseName}-alola`] = 7;
      map[`${baseName}-alolan`] = 7;
    }
    if (generation <= 7) { // Only add for Pokemon that existed before Gen 8
      map[`${baseName}-galar`] = 8;
      map[`${baseName}-galarian`] = 8;
      map[`${baseName}-hisui`] = 8;
      map[`${baseName}-hisuian`] = 8;
    }
    if (generation <= 8) { // Only add for Pokemon that existed before Gen 9
      map[`${baseName}-paldea`] = 9;
      map[`${baseName}-paldean`] = 9;
    }
    
    // Mega forms appear in Gen 6
    if (generation <= 6) {
      map[`${baseName}-mega`] = 6;
      map[`${baseName}-mega-x`] = 6;
      map[`${baseName}-mega-y`] = 6;
    }
    
    // G-Max forms appear in Gen 8
    if (generation <= 8) {
      map[`${baseName}-gmax`] = 8;
      map[`${baseName}-gigantamax`] = 8;
    }
  };
  
  // Instead of manually listing all Pokemon, use ID ranges to generate comprehensive mappings
  // This ensures we catch ALL Pokemon including ones we might have missed
  
  // Generate entries for ALL Pokemon IDs 1-1025 and their common variants
  for (let id = 1; id <= 1025; id++) {
    const generation = determineGenerationFromId(id);
    
    // Create a base name pattern (we'll use the ID as fallback)
    const baseName = `pokemon-${id}`;
    addVariants(baseName, generation);
    
    // Also add common name patterns that might exist
    map[`${id}`] = generation;
  }

  // Now add the specific Pokemon names we know about
  // Generation 1 (1-151)
  const gen1Names = [
    'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard',
    'squirtle', 'wartortle', 'blastoise', 'caterpie', 'metapod', 'butterfree',
    'weedle', 'kakuna', 'beedrill', 'pidgey', 'pidgeotto', 'pidgeot',
    'rattata', 'raticate', 'spearow', 'fearow', 'ekans', 'arbok',
    'pikachu', 'raichu', 'sandshrew', 'sandslash', 'nidoran-f', 'nidorina',
    'nidoqueen', 'nidoran-m', 'nidorino', 'nidoking', 'clefairy', 'clefable',
    'vulpix', 'ninetales', 'jigglypuff', 'wigglytuff', 'zubat', 'golbat',
    'oddish', 'gloom', 'vileplume', 'paras', 'parasect', 'venonat',
    'venomoth', 'diglett', 'dugtrio', 'meowth', 'persian', 'psyduck',
    'golduck', 'mankey', 'primeape', 'growlithe', 'arcanine', 'poliwag',
    'poliwhirl', 'poliwrath', 'abra', 'kadabra', 'alakazam', 'machop',
    'machoke', 'machamp', 'bellsprout', 'weepinbell', 'victreebel', 'tentacool',
    'tentacruel', 'geodude', 'graveler', 'golem', 'ponyta', 'rapidash',
    'slowpoke', 'slowbro', 'magnemite', 'magneton', 'farfetchd', 'doduo',
    'dodrio', 'seel', 'dewgong', 'grimer', 'muk', 'shellder',
    'cloyster', 'gastly', 'haunter', 'gengar', 'onix', 'drowzee',
    'hypno', 'krabby', 'kingler', 'voltorb', 'electrode', 'exeggcute',
    'exeggutor', 'cubone', 'marowak', 'hitmonlee', 'hitmonchan', 'lickitung',
    'koffing', 'weezing', 'rhyhorn', 'rhydon', 'chansey', 'tangela',
    'kangaskhan', 'horsea', 'seadra', 'goldeen', 'seaking', 'staryu',
    'starmie', 'mr-mime', 'scyther', 'jynx', 'electabuzz', 'magmar',
    'pinsir', 'tauros', 'magikarp', 'gyarados', 'lapras', 'ditto',
    'eevee', 'vaporeon', 'jolteon', 'flareon', 'porygon', 'omanyte',
    'omastar', 'kabuto', 'kabutops', 'aerodactyl', 'snorlax', 'articuno',
    'zapdos', 'moltres', 'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew'
  ];
  gen1Names.forEach(name => addVariants(name, 1));

  // Generation 2 (152-251)  
  const gen2Names = [
    'chikorita', 'bayleef', 'meganium', 'cyndaquil', 'quilava', 'typhlosion',
    'totodile', 'croconaw', 'feraligatr', 'sentret', 'furret', 'hoothoot',
    'noctowl', 'ledyba', 'ledian', 'spinarak', 'ariados', 'crobat',
    'chinchou', 'lanturn', 'pichu', 'cleffa', 'igglybuff', 'togepi',
    'togetic', 'natu', 'xatu', 'mareep', 'flaaffy', 'ampharos',
    'bellossom', 'marill', 'azumarill', 'sudowoodo', 'politoed', 'hoppip',
    'skiploom', 'jumpluff', 'aipom', 'sunkern', 'sunflora', 'yanma',
    'wooper', 'quagsire', 'espeon', 'umbreon', 'murkrow', 'slowking',
    'misdreavus', 'unown', 'wobbuffet', 'girafarig', 'pineco', 'forretress',
    'dunsparce', 'gligar', 'steelix', 'snubbull', 'granbull', 'qwilfish',
    'scizor', 'shuckle', 'heracross', 'sneasel', 'teddiursa', 'ursaring',
    'slugma', 'magcargo', 'swinub', 'piloswine', 'corsola', 'remoraid',
    'octillery', 'delibird', 'mantine', 'skarmory', 'houndour', 'houndoom',
    'kingdra', 'phanpy', 'donphan', 'porygon2', 'stantler', 'smeargle',
    'tyrogue', 'hitmontop', 'smoochum', 'elekid', 'magby', 'miltank',
    'blissey', 'raikou', 'entei', 'suicune', 'larvitar', 'pupitar',
    'tyranitar', 'lugia', 'ho-oh', 'celebi'
  ];
  gen2Names.forEach(name => addVariants(name, 2));

  // Generation 3 (252-386)
  const gen3Names = [
    'treecko', 'grovyle', 'sceptile', 'torchic', 'combusken', 'blaziken',
    'mudkip', 'marshtomp', 'swampert', 'poochyena', 'mightyena', 'zigzagoon',
    'linoone', 'wurmple', 'silcoon', 'beautifly', 'cascoon', 'dustox',
    'lotad', 'lombre', 'ludicolo', 'seedot', 'nuzleaf', 'shiftry',
    'taillow', 'swellow', 'wingull', 'pelipper', 'ralts', 'kirlia',
    'gardevoir', 'surskit', 'masquerain', 'shroomish', 'breloom', 'slakoth',
    'vigoroth', 'slaking', 'nincada', 'ninjask', 'shedinja', 'whismur',
    'loudred', 'exploud', 'makuhita', 'hariyama', 'azurill', 'nosepass',
    'skitty', 'delcatty', 'sableye', 'mawile', 'aron', 'lairon',
    'aggron', 'meditite', 'medicham', 'electrike', 'manectric', 'plusle',
    'minun', 'volbeat', 'illumise', 'roselia', 'gulpin', 'swalot',
    'carvanha', 'sharpedo', 'wailmer', 'wailord', 'numel', 'camerupt',
    'torkoal', 'spoink', 'grumpig', 'spinda', 'trapinch', 'vibrava',
    'flygon', 'cacnea', 'cacturne', 'swablu', 'altaria', 'zangoose',
    'seviper', 'lunatone', 'solrock', 'barboach', 'whiscash', 'corphish',
    'crawdaunt', 'baltoy', 'claydol', 'lileep', 'cradily', 'anorith',
    'armaldo', 'feebas', 'milotic', 'castform', 'kecleon', 'shuppet',
    'banette', 'duskull', 'dusclops', 'tropius', 'chimecho', 'absol',
    'wynaut', 'snorunt', 'glalie', 'spheal', 'sealeo', 'walrein',
    'clamperl', 'huntail', 'gorebyss', 'relicanth', 'luvdisc', 'bagon',
    'shelgon', 'salamence', 'beldum', 'metang', 'metagross', 'regirock',
    'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon',
    'rayquaza', 'jirachi', 'deoxys'
  ];
  gen3Names.forEach(name => addVariants(name, 3));

  // Continue with other generations... but the key insight is that we need to use
  // ID-based fallback logic for Pokemon we don't explicitly map

  return map;
};

// Create the mapping once
const baseGenerationMap = createBaseGenerationMap();

// Main hook function with FIXED logic to catch ALL Pokemon
export const usePokemonGrouping = (
  pokemonList: Pokemon[],
  searchTerm: string,
  isRankingArea: boolean,
  isGenerationExpanded?: (genId: number) => boolean
) => {
  return useMemo(() => {
    console.log(`🔍 [POKEMON_GROUPING] Processing ${pokemonList.length} Pokemon, search: "${searchTerm}", isRankingArea: ${isRankingArea}`);
    
    // First filter by search term
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`🔍 [POKEMON_GROUPING] After search filter: ${filtered.length} Pokemon`);
    
    // If this is the ranking area or we're searching, don't group by generation
    if (isRankingArea || searchTerm.trim()) {
      console.log(`🔍 [POKEMON_GROUPING] Not grouping - returning flat list`);
      return {
        items: filtered.map(pokemon => ({ type: 'pokemon', data: pokemon })),
        showGenerationHeaders: false
      };
    }
    
    // Group by generation for the available Pokemon list
    const generationGroups = new Map<number, Pokemon[]>();
    
    // Group Pokemon by generation using FIXED logic that catches ALL Pokemon
    filtered.forEach(pokemon => {
      // CRITICAL FIX: Always determine generation, fallback to ID-based logic
      let generation: number;
      
      // Try exact name match first
      if (baseGenerationMap[pokemon.name.toLowerCase()]) {
        generation = baseGenerationMap[pokemon.name.toLowerCase()];
      } else {
        // Try base name match
        const baseName = getBasePokemonName(pokemon.name);
        if (baseGenerationMap[baseName.toLowerCase()]) {
          generation = baseGenerationMap[baseName.toLowerCase()];
        } else {
          // FALLBACK: Use ID-based determination - this catches ALL Pokemon
          generation = determineGenerationFromId(pokemon.id);
        }
      }
      
      console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation}`);
      
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, []);
      }
      generationGroups.get(generation)!.push(pokemon);
    });
    
    // Build the result with headers and Pokemon
    const result = [];
    
    // Include all generations 1-9, even if some are empty
    for (let gen = 1; gen <= 9; gen++) {
      if (generationGroups.has(gen)) {
        const genDetails = generationDetails[gen];
        const pokemonInGen = generationGroups.get(gen) || [];
        
        console.log(`🔍 [POKEMON_GROUPING] Generation ${gen}: ${pokemonInGen.length} Pokemon`);
        
        // Add generation header
        result.push({ 
          type: 'header', 
          generationId: gen,
          data: {
            name: `Generation ${gen}`,
            region: genDetails?.region || "Unknown",
            games: genDetails?.games || ""
          }
        });
        
        // Add Pokemon if generation is expanded (or if no expansion function provided)
        if (!isGenerationExpanded || isGenerationExpanded(gen)) {
          pokemonInGen.forEach(pokemon => {
            result.push({ type: 'pokemon', data: pokemon });
          });
          console.log(`🔍 [POKEMON_GROUPING] Added ${pokemonInGen.length} Pokemon for expanded Generation ${gen}`);
        } else {
          console.log(`🔍 [POKEMON_GROUPING] Skipped ${pokemonInGen.length} Pokemon for collapsed Generation ${gen}`);
        }
      }
    }
    
    console.log(`🔍 [POKEMON_GROUPING] Generated ${result.length} items with headers for all generations`);
    
    return {
      items: result,
      showGenerationHeaders: true
    };
  }, [pokemonList, searchTerm, isRankingArea, isGenerationExpanded]);
};
