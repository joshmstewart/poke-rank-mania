import React, { useCallback, useMemo } from "react";
import { useFormFilters } from "@/hooks/useFormFilters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { PokemonFormType } from "@/hooks/form-filters/types";
import { FormFilterItem } from "./FormFilterItem";
import { FormFilterDebug } from "./FormFilterDebug";
import { getFilterName } from "./formFilterHelpers";

export function FormFiltersSelector() {
  const { 
    filters, 
    toggleFilter,
    isAllEnabled,
    toggleAll,
    getPokemonFormCategory,
    getMiscategorizedPokemonExamples
  } = useFormFilters();
  
  const { allPokemon, rawUnfilteredPokemon } = usePokemonContext();
  
  // Calculate counts for each form category
  const formCounts = useMemo(() => {
    console.log(`🔢 [FORM_COUNTS] Calculating form counts for ${allPokemon.length} filtered Pokemon and ${rawUnfilteredPokemon.length} raw Pokemon`);
    
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
    
    // For all categories except blocked, use the filtered Pokemon list
    allPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon);
      if (category && category !== 'blocked') {
        counts[category]++;
      }
    });
    
    // CRITICAL: For blocked category, count from raw unfiltered data
    console.log(`🚫 [BLOCKED_COUNT] Counting blocked Pokemon from ${rawUnfilteredPokemon.length} raw unfiltered Pokemon`);
    
    // ENHANCED DEBUG: Let's examine the Pokemon names more carefully
    let debugBlockedCount = 0;
    let sampleBlockedNames: string[] = [];
    let sampleNormalNames: string[] = [];
    let potentialBlockedNames: string[] = [];
    
    rawUnfilteredPokemon.forEach((pokemon, index) => {
      const category = getPokemonFormCategory(pokemon);
      if (category === 'blocked') {
        counts.blocked++;
        debugBlockedCount++;
        if (debugBlockedCount <= 10) {
          console.log(`🚫 [BLOCKED_FOUND] Found blocked Pokemon: "${pokemon.name}" (ID: ${pokemon.id})`);
          sampleBlockedNames.push(pokemon.name);
        }
      }
      
      // Log first 100 Pokemon names to see what we're working with
      if (index < 100) {
        console.log(`🔍 [SAMPLE_POKEMON] ${index + 1}: "${pokemon.name}" (ID: ${pokemon.id}) -> category: ${category}`);
        if (category === 'normal' && sampleNormalNames.length < 15) {
          sampleNormalNames.push(pokemon.name);
        }
      }
      
      // CRITICAL: Let's search for Pokemon that SHOULD be blocked based on name patterns
      const name = pokemon.name.toLowerCase();
      
      // Check for various blocking patterns
      if (name.includes('starter') || 
          name.includes('totem') || 
          name.includes('meteor') ||
          name.includes('cap') ||
          name.includes('pikachu-') ||
          name.includes('-small') ||
          name.includes('-large') ||
          name.includes('-super') ||
          name.includes('limited') ||
          name.includes('build') ||
          name.includes('mode') ||
          (name.includes('minior') && name.includes('meteor'))) {
        console.log(`🎯 [POTENTIAL_BLOCKED] Found potential blocked Pokemon: "${pokemon.name}" (ID: ${pokemon.id}) -> category: ${category}`);
        potentialBlockedNames.push(pokemon.name);
      }
      
      // Also check for specific Pokemon that are known to have blocked variants
      if (name.includes('pumpkaboo') || 
          name.includes('gourgeist') ||
          name.includes('rockruff') ||
          name.includes('cramorant') ||
          name.includes('koraidon') ||
          name.includes('miraidon') ||
          name.includes('greninja')) {
        console.log(`🔍 [VARIANT_CHECK] Found Pokemon with potential variants: "${pokemon.name}" (ID: ${pokemon.id}) -> category: ${category}`);
      }
    });
    
    console.log(`🚫 [BLOCKED_COUNT_DEBUG] Total blocked Pokemon found: ${debugBlockedCount}`);
    console.log(`🚫 [BLOCKED_SAMPLES] Sample blocked names:`, sampleBlockedNames);
    console.log(`📝 [NORMAL_SAMPLES] Sample normal names:`, sampleNormalNames);
    console.log(`🎯 [POTENTIAL_BLOCKED_LIST] Pokemon that should potentially be blocked:`, potentialBlockedNames);
    console.log(`🔢 [FORM_COUNTS] Calculated counts:`, counts);
    console.log(`🚫 [BLOCKED_COUNT_FINAL] Final blocked count: ${counts.blocked}`);
    
    // CRITICAL: If we found potential blocked Pokemon but they weren't categorized as blocked,
    // there's an issue with the categorization logic
    if (potentialBlockedNames.length > 0 && counts.blocked === 0) {
      console.error(`❌ [CATEGORIZATION_ERROR] Found ${potentialBlockedNames.length} Pokemon that should be blocked but none were categorized as blocked!`);
      console.error(`❌ [CATEGORIZATION_ERROR] This suggests an issue with the getPokemonFormCategory function`);
    }
    
    return counts;
  }, [allPokemon, rawUnfilteredPokemon, getPokemonFormCategory]);
  
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
      
      <FormFilterDebug getMiscategorizedExamples={getMiscategorizedPokemonExamples} />
      
      <Separator />
      
      <div className="space-y-4">
        <FormFilterItem
          filter="normal"
          isEnabled={filters.normal}
          count={formCounts.normal}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="regional"
          isEnabled={filters.regional}
          count={formCounts.regional}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="colorsFlavors"
          isEnabled={filters.colorsFlavors}
          count={formCounts.colorsFlavors}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="gender"
          isEnabled={filters.gender}
          count={formCounts.gender}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="forms"
          isEnabled={filters.forms}
          count={formCounts.forms}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="megaGmax"
          isEnabled={filters.megaGmax}
          count={formCounts.megaGmax}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="originPrimal"
          isEnabled={filters.originPrimal}
          count={formCounts.originPrimal}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="costumes"
          isEnabled={filters.costumes}
          count={formCounts.costumes}
          onToggle={handleToggleFilter}
        />
        
        <FormFilterItem
          filter="blocked"
          isEnabled={filters.blocked}
          count={formCounts.blocked}
          onToggle={handleToggleFilter}
          extraDescription="(starters, totems, etc.)"
        />
      </div>
    </div>
  );
}
