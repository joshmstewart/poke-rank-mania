import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonGeneration, generationDetails } from "@/components/pokemon/generationUtils";

// Helper function to determine the base Pokemon generation for special forms
const getBaseGeneration = (pokemon: Pokemon): number => {
  const name = pokemon.name.toLowerCase();
  
  // For regional forms, extract the base Pokemon name
  if (name.includes('alolan ') || name.includes('galarian ') || name.includes('hisuian ') || name.includes('paldean ')) {
    const baseName = name.replace(/^(alolan|galarian|hisuian|paldean)\s+/, '');
    
    // Map common base Pokemon to their generations
    const baseGenerationMap: Record<string, number> = {
      // Gen 1
      'rattata': 1, 'raticate': 1, 'raichu': 1, 'sandshrew': 1, 'sandslash': 1,
      'vulpix': 1, 'ninetales': 1, 'diglett': 1, 'dugtrio': 1, 'meowth': 1,
      'persian': 1, 'geodude': 1, 'graveler': 1, 'golem': 1, 'grimer': 1,
      'muk': 1, 'exeggutor': 1, 'marowak': 1, 'voltorb': 1, 'electrode': 1,
      'slowpoke': 1, 'slowbro': 1, 'farfetchd': 1, 'ponyta': 1, 'rapidash': 1,
      'slowking': 2, 'corsola': 2,
      
      // Gen 2
      'qwilfish': 2,
      
      // Gen 3
      'zigzagoon': 3, 'linoone': 3,
      
      // Gen 4
      'dialga': 4, 'palkia': 4, 'giratina': 4,
      
      // Gen 5
      'darumaka': 5, 'darmanitan': 5, 'yamask': 5, 'cofagrigus': 5, 'stunfisk': 5,
      'zorua': 5, 'zoroark': 5, 'braviary': 5,
      
      // Gen 7
      'decidueye': 7, 'typhlosion': 2, 'samurott': 5, 'lilligant': 5, 'basculin': 5,
      'sliggoo': 6, 'goodra': 6, 'avalugg': 6,
      
      // Gen 8
      'mr. mime': 1, 'articuno': 1, 'zapdos': 1, 'moltres': 1, 'weezing': 1,
      'cursola': 2,
      
      // Gen 9
      'tauros': 1, 'wooper': 2
    };
    
    if (baseGenerationMap[baseName]) {
      console.log(`🔍 [POKEMON_GROUPING] Regional form ${pokemon.name} -> base ${baseName} -> Gen ${baseGenerationMap[baseName]}`);
      return baseGenerationMap[baseName];
    }
  }
  
  // For Mega, G-Max, and other special forms, extract base name
  if (name.includes('mega ') || name.includes('g-max ') || name.includes('primal ')) {
    const baseName = name.replace(/^(mega|g-max|primal)\s+/, '').replace(/\s+[xy]$/, '');
    
    // Use the same mapping for special forms
    const baseGenerationMap: Record<string, number> = {
      // Gen 1
      'venusaur': 1, 'charizard': 1, 'blastoise': 1, 'alakazam': 1, 'gengar': 1,
      'kangaskhan': 1, 'pinsir': 1, 'gyarados': 1, 'aerodactyl': 1, 'mewtwo': 1,
      'butterfree': 1, 'pikachu': 1, 'machamp': 1, 'kingler': 1, 'lapras': 1,
      'eevee': 1, 'snorlax': 1,
      
      // Gen 3
      'blaziken': 3, 'swampert': 3, 'gardevoir': 3, 'sableye': 3, 'mawile': 3,
      'aggron': 3, 'medicham': 3, 'manectric': 3, 'sharpedo': 3, 'camerupt': 3,
      'altaria': 3, 'banette': 3, 'absol': 3, 'glalie': 3, 'salamence': 3,
      'metagross': 3, 'latias': 3, 'latios': 3, 'kyogre': 3, 'groudon': 3,
      'rayquaza': 3,
      
      // Gen 4
      'garchomp': 4, 'lucario': 4, 'abomasnow': 4,
      
      // Gen 5
      'audino': 5, 'garbodor': 5,
      
      // Gen 6
      'diancie': 6,
      
      // Gen 8 (G-Max forms)
      'corviknight': 8, 'orbeetle': 8, 'drednaw': 8, 'coalossal': 8,
      'flapple': 8, 'appletun': 8, 'sandaconda': 8, 'toxapex': 7, 'centiskorch': 8,
      'hatterene': 8, 'grimmsnarl': 8, 'alcremie': 8, 'copperajah': 8, 'duraludon': 8
    };
    
    if (baseGenerationMap[baseName]) {
      console.log(`🔍 [POKEMON_GROUPING] Special form ${pokemon.name} -> base ${baseName} -> Gen ${baseGenerationMap[baseName]}`);
      return baseGenerationMap[baseName];
    }
  }
  
  // For other special forms with parentheses like "Rotom (Heat)"
  if (name.includes('(') && name.includes(')')) {
    const baseName = name.split('(')[0].trim();
    
    const baseGenerationMap: Record<string, number> = {
      'rotom': 4, 'shaymin': 4, 'giratina': 4, 'arceus': 4, 'deoxys': 3,
      'wormadam': 4, 'cherrim': 4, 'shellos': 4, 'gastrodon': 4, 'burmy': 4,
      'dialga': 4, 'palkia': 4, 'tornadus': 5, 'thundurus': 5, 'landorus': 5,
      'kyurem': 5, 'keldeo': 5, 'meloetta': 5, 'genesect': 5, 'hoopa': 6,
      'oricorio': 7, 'lycanroc': 7, 'wishiwashi': 7, 'minior': 7, 'mimikyu': 7,
      'necrozma': 7, 'toxtricity': 8, 'indeedee': 8, 'morpeko': 8, 'zacian': 8,
      'zamazenta': 8, 'urshifu': 8, 'calyrex': 8, 'enamorus': 8, 'basculegion': 8,
      'gimmighoul': 9, 'paldea': 9, 'gourgeist': 6, 'pumpkaboo': 6
    };
    
    if (baseGenerationMap[baseName]) {
      console.log(`🔍 [POKEMON_GROUPING] Form with parentheses ${pokemon.name} -> base ${baseName} -> Gen ${baseGenerationMap[baseName]}`);
      return baseGenerationMap[baseName];
    }
  }
  
  // If no special mapping found, fall back to ID-based generation detection
  return getGenerationFromId(pokemon.id);
};

// Helper function to get generation from Pokemon ID
const getGenerationFromId = (id: number): number => {
  // Standard generation boundaries
  if (id >= 1 && id <= 151) return 1;
  else if (id >= 152 && id <= 251) return 2;
  else if (id >= 252 && id <= 386) return 3;
  else if (id >= 387 && id <= 493) return 4;
  else if (id >= 494 && id <= 649) return 5;
  else if (id >= 650 && id <= 721) return 6;
  else if (id >= 722 && id <= 809) return 7;
  else if (id >= 810 && id <= 905) return 8;
  else if (id >= 906 && id <= 1025) return 9;
  else {
    // For Pokemon with very high IDs (alternate forms), try to guess
    const lastThreeDigits = id % 1000;
    if (lastThreeDigits >= 1 && lastThreeDigits <= 151) return 1;
    else if (lastThreeDigits >= 152 && lastThreeDigits <= 251) return 2;
    else if (lastThreeDigits >= 252 && lastThreeDigits <= 386) return 3;
    else if (lastThreeDigits >= 387 && lastThreeDigits <= 493) return 4;
    else if (lastThreeDigits >= 494 && lastThreeDigits <= 649) return 5;
    else if (lastThreeDigits >= 650 && lastThreeDigits <= 721) return 6;
    else if (lastThreeDigits >= 722 && lastThreeDigits <= 809) return 7;
    else if (lastThreeDigits >= 810 && lastThreeDigits <= 905) return 8;
    else return 9; // Default to latest generation
  }
};

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
    
    // Group Pokemon by generation using improved logic
    filtered.forEach(pokemon => {
      const generation = getBaseGeneration(pokemon);
      
      console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation}`);
      
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, []);
      }
      generationGroups.get(generation)!.push(pokemon);
    });
    
    // Build the result with headers and Pokemon
    const result = [];
    
    // Ensure we include all generations 1-9, even if some are empty
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
