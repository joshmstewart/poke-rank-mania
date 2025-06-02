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
import { getStaticListBlockedCount } from "@/hooks/form-filters/categorization";

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
    
    // CRITICAL DEBUG: Check if static list is working BEFORE processing Pokemon
    console.log(`🎯 [STATIC_LIST_VERIFICATION] About to process ${rawUnfilteredPokemon.length} Pokemon through categorization`);
    
    rawUnfilteredPokemon.forEach((pokemon, index) => {
      const category = getPokemonFormCategory(pokemon);
      if (category === 'blocked') {
        counts.blocked++;
      }
      
      // Log progress every 100 Pokemon
      if (index % 100 === 0) {
        console.log(`📊 [PROGRESS] Processed ${index + 1}/${rawUnfilteredPokemon.length} Pokemon. Current blocked count: ${counts.blocked}`);
      }
    });
    
    // CRITICAL: Get static list stats after processing
    const staticStats = getStaticListBlockedCount();
    console.log(`🔢 [FORM_COUNTS] Final calculated counts:`, counts);
    console.log(`📊 [STATIC_VERIFICATION] Static list found ${staticStats.count} blocked Pokemon`);
    console.log(`🚫 [BLOCKED_COUNT_FINAL] Final blocked count: ${counts.blocked}`);
    
    // CRITICAL: Compare static list count with actual found count
    if (staticStats.count !== counts.blocked) {
      console.error(`❌ [COUNT_MISMATCH] Static list has ${staticStats.count} blocked Pokemon but categorization found ${counts.blocked}!`);
      console.error(`❌ [COUNT_MISMATCH] This indicates the static ID-based lookup is not working properly`);
    } else if (staticStats.count === 38 && counts.blocked === 38) {
      console.log(`✅ [COUNT_MATCH] SUCCESS! Found all 38 blocked Pokemon from static list!`);
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
