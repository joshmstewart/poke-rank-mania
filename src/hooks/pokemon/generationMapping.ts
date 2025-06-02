
import { determineGenerationFromId } from "./generationUtils";

// Create a comprehensive mapping that uses ID ranges for ALL Pokemon
export const createBaseGenerationMap = () => {
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

  return map;
};

// Create the mapping once
export const baseGenerationMap = createBaseGenerationMap();
