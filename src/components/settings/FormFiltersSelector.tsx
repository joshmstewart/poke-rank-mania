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
