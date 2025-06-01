
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

// Create a comprehensive mapping of base Pokemon names to their generations
const createBaseGenerationMap = () => {
  const map: Record<string, number> = {};
  
  // Generation 1 (1-151)
  const gen1Pokemon = [
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
  gen1Pokemon.forEach(name => map[name] = 1);

  // Generation 2 (152-251)
  const gen2Pokemon = [
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
  gen2Pokemon.forEach(name => map[name] = 2);

  // Generation 3 (252-386)
  const gen3Pokemon = [
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
    'crawdaunt', 'balt'oy', 'claydol', 'lileep', 'cradily', 'anorith',
    'armaldo', 'feebas', 'milotic', 'castform', 'kecleon', 'shuppet',
    'banette', 'duskull', 'dusclops', 'tropius', 'chimecho', 'absol',
    'wynaut', 'snorunt', 'glalie', 'spheal', 'sealeo', 'walrein',
    'clamperl', 'huntail', 'gorebyss', 'relicanth', 'luvdisc', 'bagon',
    'shelgon', 'salamence', 'beldum', 'metang', 'metagross', 'regirock',
    'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon',
    'rayquaza', 'jirachi', 'deoxys',
    // Fix typo in previous list
    'baltoy'
  ];
  gen3Pokemon.forEach(name => map[name] = 3);

  // Generation 4 (387-493)
  const gen4Pokemon = [
    'turtwig', 'grotle', 'torterra', 'chimchar', 'monferno', 'infernape',
    'piplup', 'prinplup', 'empoleon', 'starly', 'staravia', 'staraptor',
    'bidoof', 'bibarel', 'kricketot', 'kricketune', 'shinx', 'luxio',
    'luxray', 'budew', 'roserade', 'cranidos', 'rampardos', 'shieldon',
    'bastiodon', 'burmy', 'wormadam', 'mothim', 'combee', 'vespiquen',
    'pachirisu', 'buizel', 'floatzel', 'cherubi', 'cherrim', 'shellos',
    'gastrodon', 'ambipom', 'drifloon', 'drifblim', 'buneary', 'lopunny',
    'mismagius', 'honchkrow', 'glameow', 'purugly', 'chingling', 'stunky',
    'skuntank', 'bronzor', 'bronzong', 'bonsly', 'mime-jr', 'happiny',
    'chatot', 'spiritomb', 'gible', 'gabite', 'garchomp', 'munchlax',
    'riolu', 'lucario', 'hippopotas', 'hippowdon', 'skorupi', 'drapion',
    'croagunk', 'toxicroak', 'carnivine', 'finneon', 'lumineon', 'mantyke',
    'snover', 'abomasnow', 'weavile', 'magnezone', 'lickilicky', 'rhyperior',
    'tangrowth', 'electivire', 'magmortar', 'togekiss', 'yanmega', 'leafeon',
    'glaceon', 'gliscor', 'mamoswine', 'porygon-z', 'gallade', 'probopass',
    'dusknoir', 'froslass', 'rotom', 'uxie', 'mesprit', 'azelf',
    'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia',
    'phione', 'manaphy', 'darkrai', 'shaymin', 'arceus'
  ];
  gen4Pokemon.forEach(name => map[name] = 4);

  // Generation 5 (494-649)
  const gen5Pokemon = [
    'victini', 'snivy', 'servine', 'serperior', 'tepig', 'pignite',
    'emboar', 'oshawott', 'dewott', 'samurott', 'patrat', 'watchog',
    'lillipup', 'herdier', 'stoutland', 'purrloin', 'liepard', 'pansage',
    'simisage', 'pansear', 'simisear', 'panpour', 'simipour', 'munna',
    'musharna', 'pidove', 'tranquill', 'unfezant', 'blitzle', 'zebstrika',
    'roggenrola', 'boldore', 'gigalith', 'woobat', 'swoobat', 'drilbur',
    'excadrill', 'audino', 'timburr', 'gurdurr', 'conkeldurr', 'tympole',
    'palpitoad', 'seismitoad', 'throh', 'sawk', 'sewaddle', 'swadloon',
    'leavanny', 'venipede', 'whirlipede', 'scolipede', 'cottonee', 'whimsicott',
    'petilil', 'lilligant', 'basculin', 'sandile', 'krokorok', 'krookodile',
    'darumaka', 'darmanitan', 'maractus', 'dwebble', 'crustle', 'scraggy',
    'scrafty', 'sigilyph', 'yamask', 'cofagrigus', 'tirtouga', 'carracosta',
    'archen', 'archeops', 'trubbish', 'garbodor', 'zorua', 'zoroark',
    'minccino', 'cinccino', 'gothita', 'gothorita', 'gothitelle', 'solosis',
    'duosion', 'reuniclus', 'ducklett', 'swanna', 'vanillite', 'vanillish',
    'vanilluxe', 'deerling', 'sawsbuck', 'emolga', 'karrablast', 'escavalier',
    'foongus', 'amoonguss', 'frillish', 'jellicent', 'alomomola', 'joltik',
    'galvantula', 'ferroseed', 'ferrothorn', 'klink', 'klang', 'klinklang',
    'tynamo', 'eelektrik', 'eelektross', 'elgyem', 'beheeyem', 'litwick',
    'lampent', 'chandelure', 'axew', 'fraxure', 'haxorus', 'cubchoo',
    'beartic', 'cryogonal', 'shelmet', 'accelgor', 'stunfisk', 'mienfoo',
    'mienshao', 'druddigon', 'golett', 'golurk', 'pawniard', 'bisharp',
    'bouffalant', 'rufflet', 'braviary', 'vullaby', 'mandibuzz', 'heatmor',
    'durant', 'deino', 'zweilous', 'hydreigon', 'larvesta', 'volcarona',
    'cobalion', 'terrakion', 'virizion', 'tornadus', 'thundurus', 'reshiram',
    'zekrom', 'landorus', 'kyurem', 'keldeo', 'meloetta', 'genesect'
  ];
  gen5Pokemon.forEach(name => map[name] = 5);

  // Generation 6 (650-721)
  const gen6Pokemon = [
    'chespin', 'quilladin', 'chesnaught', 'fennekin', 'braixen', 'delphox',
    'froakie', 'frogadier', 'greninja', 'bunnelby', 'diggersby', 'fletchling',
    'fletchinder', 'talonflame', 'scatterbug', 'spewpa', 'vivillon', 'litleo',
    'pyroar', 'flabebe', 'floette', 'florges', 'skiddo', 'gogoat',
    'pancham', 'pangoro', 'furfrou', 'espurr', 'meowstic', 'honedge',
    'doublade', 'aegislash', 'spritzee', 'aromatisse', 'swirlix', 'slurpuff',
    'inkay', 'malamar', 'binacle', 'barbaracle', 'skrelp', 'dragalge',
    'clauncher', 'clawitzer', 'helioptile', 'heliolisk', 'tyrunt', 'tyrantrum',
    'amaura', 'aurorus', 'sylveon', 'hawlucha', 'dedenne', 'carbink',
    'goomy', 'sliggoo', 'goodra', 'klefki', 'phantump', 'trevenant',
    'pumpkaboo', 'gourgeist', 'bergmite', 'avalugg', 'noibat', 'noivern',
    'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa', 'volcanion'
  ];
  gen6Pokemon.forEach(name => map[name] = 6);

  // Generation 7 (722-809)
  const gen7Pokemon = [
    'rowlet', 'dartrix', 'decidueye', 'litten', 'torracat', 'incineroar',
    'popplio', 'brionne', 'primarina', 'pikipek', 'trumbeak', 'toucannon',
    'yungoos', 'gumshoos', 'grubbin', 'charjabug', 'vikavolt', 'crabrawler',
    'crabominable', 'oricorio', 'cutiefly', 'ribombee', 'rockruff', 'lycanroc',
    'wishiwashi', 'mareanie', 'toxapex', 'mudbray', 'mudsdale', 'dewpider',
    'araquanid', 'fomantis', 'lurantis', 'morelull', 'shiinotic', 'salandit',
    'salazzle', 'stufful', 'bewear', 'bounsweet', 'steenee', 'tsareena',
    'comfey', 'oranguru', 'passimian', 'wimpod', 'golisopod', 'sandygast',
    'palossand', 'pyukumuku', 'type-null', 'silvally', 'minior', 'komala',
    'turtonator', 'togedemaru', 'mimikyu', 'bruxish', 'drampa', 'dhelmise',
    'jangmo-o', 'hakamo-o', 'kommo-o', 'tapu-koko', 'tapu-lele', 'tapu-bulu',
    'tapu-fini', 'cosmog', 'cosmoem', 'solgaleo', 'lunala', 'nihilego',
    'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana', 'guzzlord',
    'necrozma', 'magearna', 'marshadow', 'poipole', 'naganadel', 'stakataka',
    'blacephalon', 'zeraora', 'meltan', 'melmetal'
  ];
  gen7Pokemon.forEach(name => map[name] = 7);

  // Generation 8 (810-905)
  const gen8Pokemon = [
    'grookey', 'thwackey', 'rillaboom', 'scorbunny', 'raboot', 'cinderace',
    'sobble', 'drizzile', 'inteleon', 'skwovet', 'greedent', 'rookidee',
    'corvisquire', 'corviknight', 'blipbug', 'dottler', 'orbeetle', 'nickit',
    'thievul', 'gossifleur', 'eldegoss', 'wooloo', 'dubwool', 'chewtle',
    'drednaw', 'yamper', 'boltund', 'rolycoly', 'carkol', 'coalossal',
    'applin', 'flapple', 'appletun', 'silicobra', 'sandaconda', 'cramorant',
    'arrokuda', 'barraskewda', 'toxel', 'toxtricity', 'sizzlipede', 'centiskorch',
    'clobbopus', 'grapploct', 'sinistea', 'polteageist', 'hatenna', 'hattrem',
    'hatterene', 'impidimp', 'morgrem', 'grimmsnarl', 'obstagoon', 'perrserker',
    'cursola', 'sirfetchd', 'mr-rime', 'runerigus', 'milcery', 'alcremie',
    'falinks', 'pincurchin', 'snom', 'frosmoth', 'stonjourner', 'eiscue',
    'indeedee', 'morpeko', 'cufant', 'copperajah', 'dracozolt', 'arctozolt',
    'dracovish', 'arctovish', 'duraludon', 'dreepy', 'drakloak', 'dragapult',
    'zacian', 'zamazenta', 'eternatus', 'kubfu', 'urshifu', 'zarude',
    'regieleki', 'regidrago', 'glastrier', 'spectrier', 'calyrex', 'wyrdeer',
    'kleavor', 'ursaluna', 'basculegion', 'sneasler', 'overqwil', 'enamorus'
  ];
  gen8Pokemon.forEach(name => map[name] = 8);

  // Generation 9 (906-1025)
  const gen9Pokemon = [
    'sprigatito', 'floragato', 'meowscarada', 'fuecoco', 'crocalor', 'skeledirge',
    'quaxly', 'quaxwell', 'quaquaval', 'lechonk', 'oinkologne', 'tarountula',
    'spidops', 'nymble', 'lokix', 'pawmi', 'pawmo', 'pawmot',
    'tandemaus', 'maushold', 'fidough', 'dachsbun', 'smoliv', 'dolliv',
    'arboliva', 'squawkabilly', 'nacli', 'naclstack', 'garganacl', 'charcadet',
    'armarouge', 'ceruledge', 'tadbulb', 'bellibolt', 'wattrel', 'kilowattrel',
    'maschiff', 'mabosstiff', 'shroodle', 'grafaiai', 'bramblin', 'brambleghast',
    'toedscool', 'toedscruel', 'klawf', 'capsakid', 'scovillain', 'rellor',
    'rabsca', 'flittle', 'espathra', 'tinkatink', 'tinkatuff', 'tinkaton',
    'wiglett', 'wugtrio', 'bombirdier', 'finizen', 'palafin', 'varoom',
    'revavroom', 'cyclizar', 'orthworm', 'glimmet', 'glimmora', 'greavard',
    'houndstone', 'flamigo', 'cetoddle', 'cetitan', 'veluza', 'dondozo',
    'tatsugiri', 'annihilape', 'clodsire', 'farigiraf', 'dudunsparce', 'kingambit',
    'great-tusk', 'scream-tail', 'brute-bonnet', 'flutter-mane', 'slither-wing', 'sandy-shocks',
    'iron-treads', 'iron-bundle', 'iron-hands', 'iron-jugulis', 'iron-moth', 'iron-thorns',
    'frigibax', 'arctibax', 'baxcalibur', 'gimmighoul', 'gholdengo', 'wo-chien',
    'chien-pao', 'ting-lu', 'chi-yu', 'roaring-moon', 'iron-valiant', 'koraidon',
    'miraidon', 'walking-wake', 'iron-leaves', 'dipplin', 'poltchageist', 'sinistcha',
    'okidogi', 'munkidori', 'fezandipiti', 'ogerpon', 'archaludon', 'hydrapple',
    'vampeagus', 'bloodmoon-ursaluna', 'gouging-fire', 'raging-bolt', 'iron-boulder',
    'iron-crown', 'terapagos', 'pecharunt', 'wooper-paldea'
  ];
  gen9Pokemon.forEach(name => map[name] = 9);

  // Special cases and fixes for regional variants or special forms that need specific generation assignments
  const specialCases: Record<string, number> = {
    'meowth-alola': 7,
    'meowth-galar': 8,
    'ponyta-galar': 8,
    'farfetchd-galar': 8,
    'mr-mime-galar': 8,
    'growlithe-hisui': 8,
    'wooper-paldea': 9,
    'tauros-paldea': 9
  };
  Object.keys(specialCases).forEach(name => {
    map[name] = specialCases[name];
  });

  return map;
};

// Create the mapping once
const baseGenerationMap = createBaseGenerationMap();

// Main hook function
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
      // Get the base name of the Pokemon (removing regional/form variants)
      const baseName = getBasePokemonName(pokemon.name);
      
      // Try to determine generation from the base Pokemon name first
      let generation: number | undefined = baseGenerationMap[baseName];
      
      // If we couldn't find the generation by name, use ID-based logic
      if (!generation) {
        generation = determineGenerationFromId(pokemon.id);
      }
      
      console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation} (base: ${baseName})`);
      
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
