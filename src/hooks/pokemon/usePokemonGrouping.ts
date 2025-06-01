import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonGeneration, generationDetails } from "@/components/pokemon/generationUtils";

// Create a comprehensive mapping of base Pokemon names to their generations
const createBaseGenerationMap = () => {
  const map: Record<string, number> = {};
  
  // Gen 1 (1-151)
  const gen1Pokemon = [
    'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise',
    'caterpie', 'metapod', 'butterfree', 'weedle', 'kakuna', 'beedrill', 'pidgey', 'pidgeotto', 'pidgeot',
    'rattata', 'raticate', 'spearow', 'fearow', 'ekans', 'arbok', 'pikachu', 'raichu', 'sandshrew', 'sandslash',
    'nidoran', 'nidorina', 'nidoqueen', 'nidorino', 'nidoking', 'clefairy', 'clefable', 'vulpix', 'ninetales',
    'jigglypuff', 'wigglytuff', 'zubat', 'golbat', 'oddish', 'gloom', 'vileplume', 'paras', 'parasect',
    'venonat', 'venomoth', 'diglett', 'dugtrio', 'meowth', 'persian', 'psyduck', 'golduck', 'mankey', 'primeape',
    'growlithe', 'arcanine', 'poliwag', 'poliwhirl', 'poliwrath', 'abra', 'kadabra', 'alakazam', 'machop', 'machoke', 'machamp',
    'bellsprout', 'weepinbell', 'victreebel', 'tentacool', 'tentacruel', 'geodude', 'graveler', 'golem',
    'ponyta', 'rapidash', 'slowpoke', 'slowbro', 'magnemite', 'magneton', 'farfetchd', 'doduo', 'dodrio',
    'seel', 'dewgong', 'grimer', 'muk', 'shellder', 'cloyster', 'gastly', 'haunter', 'gengar',
    'onix', 'drowzee', 'hypno', 'krabby', 'kingler', 'voltorb', 'electrode', 'exeggcute', 'exeggutor',
    'cubone', 'marowak', 'hitmonlee', 'hitmonchan', 'lickitung', 'koffing', 'weezing', 'rhyhorn', 'rhydon',
    'chansey', 'tangela', 'kangaskhan', 'horsea', 'seadra', 'goldeen', 'seaking', 'staryu', 'starmie',
    'mr-mime', 'scyther', 'jynx', 'electabuzz', 'magmar', 'pinsir', 'tauros', 'magikarp', 'gyarados',
    'lapras', 'ditto', 'eevee', 'vaporeon', 'jolteon', 'flareon', 'porygon', 'omanyte', 'omastar',
    'kabuto', 'kabutops', 'aerodactyl', 'snorlax', 'articuno', 'zapdos', 'moltres', 'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew'
  ];
  
  // Gen 2 (152-251)
  const gen2Pokemon = [
    'chikorita', 'bayleef', 'meganium', 'cyndaquil', 'quilava', 'typhlosion', 'totodile', 'croconaw', 'feraligatr',
    'sentret', 'furret', 'hoothoot', 'noctowl', 'ledyba', 'ledian', 'spinarak', 'ariados', 'crobat',
    'chinchou', 'lanturn', 'pichu', 'cleffa', 'igglybuff', 'togepi', 'togetic', 'natu', 'xatu',
    'mareep', 'flaaffy', 'ampharos', 'bellossom', 'marill', 'azumarill', 'sudowoodo', 'politoed', 'hoppip', 'skiploom', 'jumpluff',
    'aipom', 'sunkern', 'sunflora', 'yanma', 'wooper', 'quagsire', 'espeon', 'umbreon', 'murkrow', 'slowking',
    'misdreavus', 'unown', 'wobbuffet', 'girafarig', 'pineco', 'forretress', 'dunsparce', 'gligar', 'steelix', 'snubbull', 'granbull',
    'qwilfish', 'scizor', 'shuckle', 'heracross', 'sneasel', 'teddiursa', 'ursaring', 'slugma', 'magcargo',
    'swinub', 'piloswine', 'corsola', 'remoraid', 'octillery', 'delibird', 'mantine', 'skarmory', 'houndour', 'houndoom',
    'kingdra', 'phanpy', 'donphan', 'porygon2', 'stantler', 'smeargle', 'tyrogue', 'hitmontop', 'smoochum',
    'elekid', 'magby', 'miltank', 'blissey', 'raikou', 'entei', 'suicune', 'larvitar', 'pupitar', 'tyranitar', 'lugia', 'ho-oh', 'celebi'
  ];
  
  // Gen 3 (252-386)
  const gen3Pokemon = [
    'treecko', 'grovyle', 'sceptile', 'torchic', 'combusken', 'blaziken', 'mudkip', 'marshtomp', 'swampert',
    'poochyena', 'mightyena', 'zigzagoon', 'linoone', 'wurmple', 'silcoon', 'beautifly', 'cascoon', 'dustox',
    'lotad', 'lombre', 'ludicolo', 'seedot', 'nuzleaf', 'shiftry', 'taillow', 'swellow', 'wingull', 'pelipper',
    '             ralts', 'kirlia', 'gardevoir', 'surskit', 'masquerain', 'shroomish', 'breloom', 'slakoth', 'vigoroth', 'slaking',
    'nincada', 'ninjask', 'shedinja', 'whismur', 'loudred', 'exploud', 'makuhita', 'hariyama', 'azurill',
    'nosepass', 'skitty', 'delcatty', 'sableye', 'mawile', 'aron', 'lairon', 'aggron', 'meditite', 'medicham',
    'electrike', 'manectric', 'plusle', 'minun', 'volbeat', 'illumise', 'roselia', 'gulpin', 'swalot',
    'carvanha', 'sharpedo', 'wailmer', 'wailord', 'numel', 'camerupt', 'torkoal', 'spoink', 'grumpig',
    'spinda', 'trapinch', 'vibrava', 'flygon', 'cacnea', 'cacturne', 'swablu', 'altaria', 'zangoose', 'seviper',
    'lunatone', 'solrock', 'barboach', 'whiscash', 'corphish', 'crawdaunt', 'baltoy', 'claydol', 'lileep', 'cradily',
    'anorith', 'armaldo', 'feebas', 'milotic', 'castform', 'kecleon', 'shuppet', 'banette', 'duskull', 'dusclops',
    'tropius', 'chimecho', 'absol', 'wynaut', 'snorunt', 'glalie', 'spheal', 'sealeo', 'walrein', 'clamperl', 'huntail', 'gorebyss',
    'relicanth', 'luvdisc', 'bagon', 'shelgon', 'salamence', 'beldum', 'metang', 'metagross', 'regirock', 'regice', 'registeel',
    'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys'
  ];
  
  // Gen 4 (387-493)
  const gen4Pokemon = [
    'turtwig', 'grotle', 'torterra', 'chimchar', 'monferno', 'infernape', 'piplup', 'prinplup', 'empoleon',
    'starly', 'staravia', 'staraptor', 'bidoof', 'bibarel', 'kricketot', 'kricketune', 'shinx', 'luxio', 'luxray',
    'budew', 'roserade', 'cranidos', 'rampardos', 'shieldon', 'bastiodon', 'burmy', 'wormadam', 'mothim',
    'combee', 'vespiquen', 'pachirisu', 'buizel', 'floatzel', 'cherubi', 'cherrim', 'shellos', 'gastrodon',
    'ambipom', 'drifloon', 'drifblim', 'buneary', 'lopunny', 'mismagius', 'honchkrow', 'glameow', 'purugly',
    'chingling', 'stunky', 'skuntank', 'bronzor', 'bronzong', 'bonsly', 'mime-jr', 'happiny', 'chatot',
    'spiritomb', 'gible', 'gabite', 'garchomp', 'munchlax', 'riolu', 'lucario', 'hippopotas', 'hippowdon',
    'skorupi', 'drapion', 'croagunk', 'toxicroak', 'carnivine', 'finneon', 'lumineon', 'mantyke',
    'snover', 'abomasnow', 'weavile', 'magnezone', 'lickilicky', 'rhyperior', 'tangrowth', 'electivire',
    'magmortar', 'togekiss', 'yanmega', 'leafeon', 'glaceon', 'gliscor', 'mamoswine', 'porygon-z',
    'gallade', 'probopass', 'dusknoir', 'froslass', 'rotom', 'uxie', 'mesprit', 'azelf', 'dialga',
    'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia', 'phione', 'manaphy', 'darkrai', 'shaymin', 'arceus'
  ];
  
  // Gen 5 (494-649)
  const gen5Pokemon = [
    'victini', 'snivy', 'servine', 'serperior', 'tepig', 'pignite', 'emboar', 'oshawott', 'dewott', 'samurott',
    'patrat', 'watchog', 'lillipup', 'herdier', 'stoutland', 'purrloin', 'liepard', 'pansage', 'simisage',
    'pansear', 'simisear', 'panpour', 'simipour', 'munna', 'musharna', 'pidove', 'tranquill', 'unfezant',
    'blitzle', 'zebstrika', 'roggenrola', 'boldore', 'gigalith', 'woobat', 'swoobat', 'drilbur', 'excadrill',
    'audino', 'timburr', 'gurdurr', 'conkeldurr', 'tympole', 'palpitoad', 'seismitoad', 'throh', 'sawk',
    'sewaddle', 'swadloon', 'leavanny', 'venipede', 'whirlipede', 'scolipede', 'cottonee', 'whimsicott',
    'petilil', 'lilligant', 'basculin', 'sandile', 'krokorok', 'krookodile', 'darumaka', 'darmanitan',
    'maractus', 'dwebble', 'crustle', 'scraggy', 'scrafty', 'sigilyph', 'yamask', 'cofagrigus',
    'tirtouga', 'carracosta', 'archen', 'archeops', 'trubbish', 'garbodor', 'zorua', 'zoroark',
    'minccino', 'cinccino', 'gothita', 'gothorita', 'gothitelle', 'solosis', 'duosion', 'reuniclus',
    'ducklett', 'swanna', 'vanillite', 'vanillish', 'vanilluxe', 'deerling', 'sawsbuck', 'emolga',
    'karrablast', 'escavalier', 'foongus', 'amoonguss', 'frillish', 'jellicent', 'alomomola',
    'joltik', 'galvantula', 'ferroseed', 'ferrothorn', 'klink', 'klang', 'klinklang', 'tynamo',
    'eelektrik', 'eelektross', 'elgyem', 'beheeyem', 'litwick', 'lampent', 'chandelure', 'axew',
    'fraxure', 'haxorus', 'cubchoo', 'beartic', 'cryogonal', 'shelmet', 'accelgor', 'stunfisk',
    'mienfoo', 'mienshao', 'druddigon', 'golett', 'golurk', 'pawniard', 'bisharp', 'bouffalant',
    'rufflet', 'braviary', 'vullaby', 'mandibuzz', 'heatmor', 'durant', 'deino', 'zweilous', 'hydreigon',
    'larvesta', 'volcarona', 'cobalion', 'terrakion', 'virizion', 'tornadus', 'thundurus', 'reshiram',
    'zekrom', 'landorus', 'kyurem', 'keldeo', 'meloetta', 'genesect'
  ];
  
  // Gen 6 (650-721)
  const gen6Pokemon = [
    'chespin', 'quilladin', 'chesnaught', 'fennekin', 'braixen', 'delphox', 'froakie', 'frogadier', 'greninja',
    'bunnelby', 'diggersby', 'fletchling', 'fletchinder', 'talonflame', 'scatterbug', 'spewpa', 'vivillon',
    'litleo', 'pyroar', 'flabebe', 'floette', 'florges', 'skiddo', 'gogoat', 'pancham', 'pangoro',
    'furfrou', 'espurr', 'meowstic', 'honedge', 'doublade', 'aegislash', 'spritzee', 'aromatisse',
    'swirlix', 'slurpuff', 'inkay', 'malamar', 'binacle', 'barbaracle', 'skrelp', 'dragalge',
    'clauncher', 'clawitzer', 'helioptile', 'heliolisk', 'tyrunt', 'tyrantrum', 'amaura', 'aurorus',
    'sylveon', 'hawlucha', 'dedenne', 'carbink', 'goomy', 'sliggoo', 'goodra', 'klefki',
    'phantump', 'trevenant', 'pumpkaboo', 'gourgeist', 'bergmite', 'avalugg', 'noibat', 'noivern',
    'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa', 'volcanion'
  ];
  
  // Gen 7 (722-809)
  const gen7Pokemon = [
    'rowlet', 'dartrix', 'decidueye', 'litten', 'torracat', 'incineroar', 'popplio', 'brionne', 'primarina',
    'pikipek', 'trumbeak', 'toucannon', 'yungoos', 'gumshoos', 'grubbin', 'charjabug', 'vikavolt',
    'crabrawler', 'crabominable', 'oricorio', 'cutiefly', 'ribombee', 'rockruff', 'lycanroc',
    'wishiwashi', 'mareanie', 'toxapex', 'mudbray', 'mudsdale', 'dewpider', 'araquanid',
    'fomantis', 'lurantis', 'morelull', 'shiinotic', 'salandit', 'salazzle', 'stufful', 'bewear',
    'bounsweet', 'steenee', 'tsareena', 'comfey', 'oranguru', 'passimian', 'wimpod', 'golisopod',
    'sandygast', 'palossand', 'pyukumuku', 'type-null', 'silvally', 'minior', 'komala',
    'turtonator', 'togedemaru', 'mimikyu', 'bruxish', 'drampa', 'dhelmise', 'jangmo-o',
    'hakamo-o', 'kommo-o', 'tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini',
    'cosmog', 'cosmoem', 'solgaleo', 'lunala', 'nihilego', 'buzzwole', 'pheromosa',
    'xurkitree', 'celesteela', 'kartana', 'guzzlord', 'necrozma', 'magearna', 'marshadow',
    'poipole', 'naganadel', 'stakataka', 'blacephalon', 'zeraora', 'meltan', 'melmetal'
  ];
  
  // Gen 8 (810-905)
  const gen8Pokemon = [
    'grookey', 'thwackey', 'rillaboom', 'scorbunny', 'raboot', 'cinderace', 'sobble', 'drizzile', 'inteleon',
    'skwovet', 'greedent', 'rookidee', 'corvisquire', 'corviknight', 'blipbug', 'dottler', 'orbeetle',
    'nickit', 'thievul', 'gossifleur', 'eldegoss', 'wooloo', 'dubwool', 'chewtle', 'drednaw',
    'yamper', 'boltund', 'rolycoly', 'carkol', 'coalossal', 'applin', 'flapple', 'appletun',
    'silicobra', 'sandaconda', 'cramorant', 'arrokuda', 'barraskewda', 'toxel', 'toxtricity',
    'sizzlipede', 'centiskorch', 'clobbopus', 'grapploct', 'sinistea', 'polteageist',
    'hatenna', 'hattrem', 'hatterene', 'impidimp', 'morgrem', 'grimmsnarl', 'obstagoon',
    'perrserker', 'cursola', 'sirfetchd', 'mr-rime', 'runerigus', 'milcery', 'alcremie',
    'falinks', 'pincurchin', 'snom', 'frosmoth', 'stonjourner', 'eiscue', 'indeedee',
    'morpeko', 'cufant', 'copperajah', 'dracozolt', 'arctozolt', 'dracovish', 'arctovish',
    'duraludon', 'dreepy', 'drakloak', 'dragapult', 'zacian', 'zamazenta', 'eternatus',
    'kubfu', 'urshifu', 'zarude', 'regieleki', 'regidrago', 'glastrier', 'spectrier', 'calyrex'
  ];
  
  // Gen 9 (906-1025)
  const gen9Pokemon = [
    'sprigatito', 'floragato', 'meowscarada', 'fuecoco', 'crocalor', 'skeledirge', 'quaxly', 'quaxwell', 'quaquaval',
    'lechonk', 'oinkologne', 'tarountula', 'spidops', 'nymble', 'lokix', 'pawmi', 'pawmo', 'pawmot',
    'tandemaus', 'maushold', 'fidough', 'dachsbun', 'smoliv', 'dolliv', 'arboliva', 'squawkabilly',
    'nacli', 'naclstack', 'garganacl', 'charcadet', 'armarouge', 'ceruledge', 'tadbulb', 'bellibolt',
    'wattrel', 'kilowattrel', 'maschiff', 'mabosstiff', 'shroodle', 'grafaiai', 'bramblin', 'brambleghast',
    'toedscool', 'toedscruel', 'klawf', 'capsakid', 'scovillain', 'rellor', 'rabsca', 'flittle', 'espathra',
    'tinkatink', 'tinkatuff', 'tinkaton', 'wiglett', 'wugtrio', 'bombirdier', 'finizen', 'palafin',
    'varoom', 'revavroom', 'cyclizar', 'orthworm', 'glimmet', 'glimmora', 'greavard', 'houndstone',
    'flamigo', 'cetoddle', 'cetitan', 'veluza', 'dondozo', 'tatsugiri', 'annihilape', 'clodsire',
    'farigiraf', 'dudunsparce', 'kingambit', 'great-tusk', 'scream-tail', 'brute-bonnet', 'flutter-mane',
    'slither-wing', 'sandy-shocks', 'iron-treads', 'iron-bundle', 'iron-hands', 'iron-jugulis',
    'iron-moth', 'iron-thorns', 'frigibax', 'arctibax', 'baxcalibur', 'gimmighoul', 'gholdengo',
    'wo-chien', 'chien-pao', 'ting-lu', 'chi-yu', 'roaring-moon', 'iron-valiant', 'koraidon',
    'miraidon', 'walking-wake', 'iron-leaves', 'dipplin', 'poltchageist', 'sinistcha', 'okidogi',
    'munkidori', 'fezandipiti', 'ogerpon', 'archaludon', 'hydrapple', 'vampeagus', 'bloodmoon-ursaluna',
    'gouging-fire', 'raging-bolt', 'iron-boulder', 'iron-crown', 'terapagos', 'pecharunt'
  ];
  
  // Map Pokemon to their generations
  gen1Pokemon.forEach(name => map[name] = 1);
  gen2Pokemon.forEach(name => map[name] = 2);
  gen3Pokemon.forEach(name => map[name] = 3);
  gen4Pokemon.forEach(name => map[name] = 4);
  gen5Pokemon.forEach(name => map[name] = 5);
  gen6Pokemon.forEach(name => map[name] = 6);
  gen7Pokemon.forEach(name => map[name] = 7);
  gen8Pokemon.forEach(name => map[name] = 8);
  gen9Pokemon.forEach(name => map[name] = 9);
  
  // Handle special cases for regional forms
  map['wooper-paldea'] = 9; // Paldean Wooper is Gen 9
  
  return map;
};

// Create the mapping once
const baseGenerationMap = createBaseGenerationMap();

// Function to extract base Pokemon name from any variant
const getBasePokemonName = (pokemonName: string): string => {
  // Handle special cases first
  if (pokemonName.toLowerCase().includes('wooper-paldea')) {
    return 'wooper-paldea'; // Special case for Paldean Wooper
  }
  
  // Remove common prefixes for regional forms
  let name = pokemonName.toLowerCase();
  
  // Strip regional prefixes
  const regionalPrefixes = ['alolan-', 'galarian-', 'hisuian-', 'paldean-'];
  for (const prefix of regionalPrefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length);
      break;
    }
  }
  
  // Remove form suffixes (mega-, gmax-, etc)
  name = name.replace(/-mega(-[xy])?$|-gmax$|-gigantamax$|-primal$|-origin$|-blade$|-shield$|-altered$|-white$|-black$|-sky$|-therian$|-incarnate$|-complete$|-50$|-10$|-crowned$/, '');
  
  // Handle special format with hyphens (we want to keep base name only)
  if (name.includes('-')) {
    // Only take the part before the first hyphen, which is usually the base Pokemon name
    name = name.split('-')[0];
  }
  
  return name;
};

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
    
    // Group Pokemon by generation using the base form mapping
    filtered.forEach(pokemon => {
      // Get the base name of the Pokemon (removing regional/form variants)
      const baseName = getBasePokemonName(pokemon.name);
      
      // Determine generation based on the base Pokemon name
      let generation: number | undefined = baseGenerationMap[baseName];
      
      // If we couldn't find the generation by name, fall back to ID-based logic
      if (!generation) {
        if (pokemon.id >= 1 && pokemon.id <= 151) generation = 1;
        else if (pokemon.id >= 152 && pokemon.id <= 251) generation = 2;
        else if (pokemon.id >= 252 && pokemon.id <= 386) generation = 3;
        else if (pokemon.id >= 387 && pokemon.id <= 493) generation = 4;
        else if (pokemon.id >= 494 && pokemon.id <= 649) generation = 5;
        else if (pokemon.id >= 650 && pokemon.id <= 721) generation = 6;
        else if (pokemon.id >= 722 && pokemon.id <= 809) generation = 7;
        else if (pokemon.id >= 810 && pokemon.id <= 905) generation = 8;
        else if (pokemon.id >= 906 && pokemon.id <= 1025) generation = 9;
        else {
          // For Pokemon with IDs outside normal ranges, try to infer generation
          const lastThreeDigits = pokemon.id % 1000;
          if (lastThreeDigits >= 1 && lastThreeDigits <= 151) generation = 1;
          else if (lastThreeDigits >= 152 && lastThreeDigits <= 251) generation = 2;
          else if (lastThreeDigits >= 252 && lastThreeDigits <= 386) generation = 3;
          else if (lastThreeDigits >= 387 && lastThreeDigits <= 493) generation = 4;
          else if (lastThreeDigits >= 494 && lastThreeDigits <= 649) generation = 5;
          else if (lastThreeDigits >= 650 && lastThreeDigits <= 721) generation = 6;
          else if (lastThreeDigits >= 722 && lastThreeDigits <= 809) generation = 7;
          else if (lastThreeDigits >= 810 && lastThreeDigits <= 905) generation = 8;
          else generation = 9; // Default to latest generation
        }
      }
      
      console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation} (base: ${baseName})`);
      
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
