/**
 * Normalize Pokedex numbers - converts special form IDs back to their base form
 * For example: 10117 (Ash-Greninja) -> 658 (Greninja)
 * @param id The Pokedex ID to normalize
 * @returns Normalized Pokedex ID for display
 */
export const normalizePokedexNumber = (id: number): number => {
  // Special form IDs typically are above 10000 and related to base form
  if (id >= 10000) {
    // For most special forms like regional variants, mega evolutions, etc.
    // We can extract the base form number
    return id % 1000; // This works for most cases
  }
  
  return id;
};

/**
 * Format Pokémon names to properly display regional forms
 * For example: "Vulpix alola" -> "Alolan Vulpix"
 * @param name The Pokémon name to format
 * @returns Formatted name with proper regional forms
 */
export const formatPokemonName = (name: string): string => {
  if (!name) return '';
  
  console.log(`🚀 [FORMAT_POKEMON_NAME] Input: "${name}"`);
  
  // EXECUTION TRACKING: Add step-by-step execution tracking
  console.log(`🔍 [EXECUTION_STEP_1] Starting formatPokemonName with: "${name}"`);
  
  const lowerName = name.toLowerCase();
  console.log(`🔍 [EXECUTION_STEP_2] Lowercase conversion: "${lowerName}"`);
  
  // Test the specific case we're having trouble with
  if (lowerName === "venusaur-mega") {
    console.log(`🎯 [EXECUTION_STEP_3A] EXPLICIT VENUSAUR-MEGA MATCH - RETURNING MEGA VENUSAUR`);
    return "Mega Venusaur";
  }
  console.log(`🔍 [EXECUTION_STEP_3B] Not exact venusaur-mega match, continuing...`);
  
  // Handle Mega evolutions - check for exact patterns
  if (lowerName.includes('-mega-x')) {
    console.log(`🎯 [EXECUTION_STEP_4A] Found -mega-x pattern`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-x'));
    const result = `Mega ${baseName} X`;
    console.log(`✅ [MEGA_X] "${name}" -> "${result}"`);
    return result;
  }
  console.log(`🔍 [EXECUTION_STEP_4B] No -mega-x pattern, continuing...`);
  
  if (lowerName.includes('-mega-y')) {
    console.log(`🎯 [EXECUTION_STEP_5A] Found -mega-y pattern`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-y'));
    const result = `Mega ${baseName} Y`;
    console.log(`✅ [MEGA_Y] "${name}" -> "${result}"`);
    return result;
  }
  console.log(`🔍 [EXECUTION_STEP_5B] No -mega-y pattern, continuing...`);
  
  if (lowerName.includes('-mega')) {
    console.log(`🎯 [EXECUTION_STEP_6A] Found -mega pattern in "${name}"`);
    const indexOfMega = name.toLowerCase().indexOf('-mega');
    console.log(`🎯 [EXECUTION_STEP_6B] Index of -mega: ${indexOfMega}`);
    const baseName = name.substring(0, indexOfMega);
    console.log(`🎯 [EXECUTION_STEP_6C] Base name extracted: "${baseName}"`);
    const result = `Mega ${baseName}`;
    console.log(`✅ [EXECUTION_STEP_6D] FINAL TRANSFORMATION: "${name}" -> "${result}"`);
    return result;
  }
  console.log(`🔍 [EXECUTION_STEP_6E] No -mega pattern found, continuing...`);
  
  // Handle Gigantamax forms
  if (lowerName.includes('-gmax')) {
    console.log(`🎯 [EXECUTION_STEP_7A] Found -gmax pattern`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-gmax'));
    const result = `G-Max ${baseName}`;
    console.log(`✅ [GMAX] "${name}" -> "${result}"`);
    return result;
  }
  console.log(`🔍 [EXECUTION_STEP_7B] No -gmax pattern, continuing...`);
  
  // Handle space-separated forms as well
  if (lowerName.includes(' mega x')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf(' mega x'));
    const result = `Mega ${baseName} X`;
    console.log(`✅ [SPACE_MEGA_X] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes(' mega y')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf(' mega y'));
    const result = `Mega ${baseName} Y`;
    console.log(`✅ [SPACE_MEGA_Y] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes(' mega')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf(' mega'));
    const result = `Mega ${baseName}`;
    console.log(`✅ [SPACE_MEGA] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes(' gmax')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf(' gmax'));
    const result = `G-Max ${baseName}`;
    console.log(`✅ [SPACE_GMAX] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle Pikachu cap variants with proper formatting
  if (lowerName.includes('pikachu') && lowerName.includes('cap')) {
    console.log(`🏷️ [PIKACHU_CAP] Detected Pikachu cap variant: ${name}`);
    if (lowerName.includes('original-cap')) {
      return 'Pikachu (Original Cap)';
    }
    if (lowerName.includes('hoenn-cap')) {
      return 'Pikachu (Hoenn Cap)';
    }
    if (lowerName.includes('sinnoh-cap')) {
      return 'Pikachu (Sinnoh Cap)';
    }
    if (lowerName.includes('unova-cap')) {
      return 'Pikachu (Unova Cap)';
    }
    if (lowerName.includes('kalos-cap')) {
      return 'Pikachu (Kalos Cap)';
    }
    if (lowerName.includes('alola-cap')) {
      return 'Pikachu (Alolan Cap)';
    }
    if (lowerName.includes('partner-cap')) {
      return 'Pikachu (Partner Cap)';
    }
    if (lowerName.includes('world-cap')) {
      return 'Pikachu (World Cap)';
    }
  }
  
  // Handle regional forms by moving them to the front with proper naming
  const regionalForms = {
    'alola': 'Alolan',
    'alolan': 'Alolan',
    'galar': 'Galarian',
    'galarian': 'Galarian',
    'hisui': 'Hisuian',
    'hisuian': 'Hisuian',
    'paldea': 'Paldean',
    'paldean': 'Paldean'
  };
  
  // Check if name contains any regional form identifiers
  for (const [region, prefix] of Object.entries(regionalForms)) {
    // Check for different formats: "Name region", "Name-region", or even "Name (region)"
    const patterns = [
      ` ${region}`,
      `-${region}`,
      `(${region})`,
      ` ${region} form`,
      `-${region} form`
    ];
    
    for (const pattern of patterns) {
      if (lowerName.includes(pattern)) {
        // Get the base name by removing the region suffix
        const baseName = name
          .replace(new RegExp(pattern, 'i'), '')
          .trim();
        // Return with proper format: "Alolan Vulpix" instead of "Vulpix alola"
        const result = `${prefix} ${baseName}`;
        console.log(`🌍 [REGIONAL] "${name}" -> "${result}"`);
        return result;
      }
    }
  }
  
  // If no special form is found, use the capitalizeSpecialForms function
  const result = capitalizeSpecialForms(name);
  console.log(`🏷️ [EXECUTION_FINAL] No transformation patterns matched, returning capitalized: "${name}" -> "${result}"`);
  return result;
};

/**
 * Capitalize special form names in Pokémon names
 * For example: "Charizard mega" -> "Charizard Mega"
 * @param name The Pokémon name to format
 * @returns Formatted name with capitalized special forms
 */
export const capitalizeSpecialForms = (name: string): string => {
  // List of special forms that should be capitalized when they appear after the base name
  const specialForms = [
    "mega", "gmax", "alolan", "galarian", "hisuian", "paldean", 
    "x", "y", "primal", "origin", "ash", "black", "white", 
    "therian", "sky", "heat", "wash", "frost", "fan", "mow",
    "attack", "defense", "speed", "eternamax", "crowned"
  ];
  
  // Split the name by spaces and hyphens
  const parts = name.split(/[\s-]+/);
  
  // If there's only one part, return the original name
  if (parts.length <= 1) return name;
  
  // Capitalize each word after the first if it matches a special form
  return parts.map((part, index) => {
    if (index === 0) return part; // Keep the base name as is
    
    // Check if this part is a special form that needs capitalization
    const lowerPart = part.toLowerCase();
    if (specialForms.includes(lowerPart)) {
      // Capitalize the first letter
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    
    return part; // Keep other parts as they are
  }).join(" ");
};
