import React, { useCallback, useMemo } from "react";
import { useFormFilters } from "@/hooks/useFormFilters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePokemonContext } from "@/contexts/PokemonContext";

export type PokemonFormType = 
  | "normal"
  | "megaGmax" 
  | "regional" 
  | "gender" 
  | "forms"
  | "originPrimal"
  | "costumes"
  | "colorsFlavors"
  | "blocked";

// Image URLs for different form types
const formExampleImages = {
  normal: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png", // Pikachu
  regional: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png", // Alolan Muk
  gender: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/593.png", // Female Jellicent
  forms: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10120.png", // Hoopa Unbound
  megaGmax: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png", // Mega Charizard Y
  originPrimal: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10007.png", // Giratina Origin
  costumes: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10094.png", // Pikachu with Original Cap
  colorsFlavors: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/774.png", // Minior (represents color variants)
  blocked: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png", // Bulbasaur (represents blocked starter)
};

export function FormFiltersSelector() {
  const { 
    filters, 
    toggleFilter,
    isAllEnabled,
    toggleAll,
    getPokemonFormCategory,
    getMiscategorizedPokemonExamples
  } = useFormFilters();
  
  const { allPokemon } = usePokemonContext();
  
  // Calculate counts for each form category
  const formCounts = useMemo(() => {
    console.log(`🔢 [FORM_COUNTS] Calculating form counts for ${allPokemon.length} Pokemon`);
    
    const counts: Record<PokemonFormType, number> = {
      normal: 0,
      megaGmax: 0,
      regional: 0,
      gender: 0,
      forms: 0,
      originPrimal: 0,
      costumes: 0,
      colorsFlavors: 0,
      blocked: 0
    };
    
    allPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon);
      if (category) {
        counts[category]++;
      }
    });
    
    console.log(`🔢 [FORM_COUNTS] Calculated counts:`, counts);
    
    return counts;
  }, [allPokemon, getPokemonFormCategory]);
  
  // Callback to handle toggling a filter
  const handleToggleFilter = useCallback((filter: PokemonFormType) => {
    toggleFilter(filter);
    
    // Show toast with appropriate message
    toast({
      title: `${filters[filter] ? "Disabled" : "Enabled"} ${getFilterName(filter)}`,
      description: filters[filter] 
        ? `${getFilterName(filter)} will no longer appear in battles`
        : `${getFilterName(filter)} will now be included in battles`,
    });
  }, [filters, toggleFilter]);
  
  // Callback to handle toggling all filters
  const handleToggleAll = useCallback(() => {
    toggleAll();
    
    toast({
      title: isAllEnabled ? "Disabled some Pokémon forms" : "Enabled all Pokémon forms",
      description: isAllEnabled 
        ? "Only standard forms will appear in battles"
        : "All Pokémon forms will be included in battles",
    });
  }, [isAllEnabled, toggleAll]);
  
  // Helper to get friendly filter name
  const getFilterName = (filter: PokemonFormType): string => {
    switch (filter) {
      case "normal": return "Normal Pokémon";
      case "megaGmax": return "Mega & Gigantamax Forms";
      case "regional": return "Regional Variants";
      case "gender": return "Gender Differences";
      case "forms": return "Special Forms";
      case "originPrimal": return "Origin & Primal Forms";
      case "costumes": return "Costume Pokémon";
      case "colorsFlavors": return "Colors & Flavors";
      case "blocked": return "Blocked Pokémon";
    }
  };

  // NEW: Enhanced debug function to show complete lists
  const showMiscategorizedExamples = useCallback(() => {
    const examples = getMiscategorizedPokemonExamples();
    console.log(`🔍 [DEBUG_EXAMPLES] Full miscategorized examples:`, examples);
    
    // Show detailed breakdown in console with full lists
    Object.entries(examples).forEach(([category, pokemonList]) => {
      if (pokemonList.length > 0) {
        console.log(`🔍 [DEBUG_${category.toUpperCase()}_FULL]`, pokemonList);
        console.log(`🔍 [DEBUG_${category.toUpperCase()}_COUNT] Total: ${pokemonList.length}`);
      }
    });
    
    // Also create a comprehensive summary
    const summary = Object.entries(examples)
      .map(([category, pokemonList]) => `${category}: ${pokemonList.length}`)
      .join(', ');
    
    console.log(`🔍 [DEBUG_SUMMARY] Category counts: ${summary}`);
    
    // Create a downloadable JSON file with all the data
    const dataStr = JSON.stringify(examples, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pokemon-categorization-debug.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Debug Data Exported",
      description: "Full categorization data logged to console and downloaded as JSON file",
    });
  }, [getMiscategorizedPokemonExamples]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Pokémon Form Filters</h3>
        <div className="flex items-center space-x-2">
          <Switch 
            id="all-forms" 
            checked={isAllEnabled}
            onCheckedChange={handleToggleAll} 
          />
          <Label htmlFor="all-forms" className="text-sm">All Forms</Label>
        </div>
      </div>
      
      {/* NEW: Debug button */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={showMiscategorizedExamples}
          className="text-xs"
        >
          Debug Categorization
        </Button>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        {/* Normal Pokémon */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.normal} alt="Normal Pokémon" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="normal" className="text-sm">Normal Pokémon</Label>
              <span className="text-xs text-muted-foreground">{formCounts.normal} Pokemon</span>
            </div>
            <Switch 
              id="normal" 
              checked={filters.normal}
              onCheckedChange={() => handleToggleFilter("normal")} 
            />
          </div>
        </div>
        
        {/* Regional Variants */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.regional} alt="Regional Form" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="regional" className="text-sm">Regional Variants</Label>
              <span className="text-xs text-muted-foreground">{formCounts.regional} Pokemon</span>
            </div>
            <Switch 
              id="regional" 
              checked={filters.regional}
              onCheckedChange={() => handleToggleFilter("regional")} 
            />
          </div>
        </div>
        
        {/* Colors & Flavors */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.colorsFlavors} alt="Color/Flavor Variant" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="colorsFlavors" className="text-sm">Colors & Flavors</Label>
              <span className="text-xs text-muted-foreground">{formCounts.colorsFlavors} Pokemon</span>
            </div>
            <Switch 
              id="colorsFlavors" 
              checked={filters.colorsFlavors}
              onCheckedChange={() => handleToggleFilter("colorsFlavors")} 
            />
          </div>
        </div>
        
        {/* Gender Differences */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.gender} alt="Gender Form" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="gender" className="text-sm">Gender Differences</Label>
              <span className="text-xs text-muted-foreground">{formCounts.gender} Pokemon</span>
            </div>
            <Switch 
              id="gender" 
              checked={filters.gender}
              onCheckedChange={() => handleToggleFilter("gender")} 
            />
          </div>
        </div>
        
        {/* Special Forms */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.forms} alt="Special Form" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="forms" className="text-sm">Special Forms</Label>
              <span className="text-xs text-muted-foreground">{formCounts.forms} Pokemon</span>
            </div>
            <Switch 
              id="forms" 
              checked={filters.forms}
              onCheckedChange={() => handleToggleFilter("forms")} 
            />
          </div>
        </div>
        
        {/* Mega Evolutions and Gigantamax Forms */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.megaGmax} alt="Mega/Gmax Form" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="megaGmax" className="text-sm">Mega & Gigantamax Forms</Label>
              <span className="text-xs text-muted-foreground">{formCounts.megaGmax} Pokemon</span>
            </div>
            <Switch 
              id="megaGmax" 
              checked={filters.megaGmax}
              onCheckedChange={() => handleToggleFilter("megaGmax")} 
            />
          </div>
        </div>
        
        {/* Origin & Primal Forms */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.originPrimal} alt="Origin/Primal Form" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="originPrimal" className="text-sm">Origin & Primal Forms</Label>
              <span className="text-xs text-muted-foreground">{formCounts.originPrimal} Pokemon</span>
            </div>
            <Switch 
              id="originPrimal" 
              checked={filters.originPrimal}
              onCheckedChange={() => handleToggleFilter("originPrimal")} 
            />
          </div>
        </div>
        
        {/* Costume Pokémon */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.costumes} alt="Costume Pokémon" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="costumes" className="text-sm">Costume Pokémon</Label>
              <span className="text-xs text-muted-foreground">{formCounts.costumes} Pokemon</span>
            </div>
            <Switch 
              id="costumes" 
              checked={filters.costumes}
              onCheckedChange={() => handleToggleFilter("costumes")} 
            />
          </div>
        </div>
        
        {/* Blocked Pokémon */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.blocked} alt="Blocked Pokémon" className="h-8 w-8 object-contain grayscale" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="blocked" className="text-sm">Blocked Pokémon</Label>
              <span className="text-xs text-muted-foreground">{formCounts.blocked} Pokemon (starters, totems, etc.)</span>
            </div>
            <Switch 
              id="blocked" 
              checked={filters.blocked}
              onCheckedChange={() => handleToggleFilter("blocked")} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
