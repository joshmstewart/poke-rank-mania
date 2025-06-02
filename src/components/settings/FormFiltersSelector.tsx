
import React from "react";
import { useFormFilters } from "@/hooks/useFormFilters";
import { Separator } from "@/components/ui/separator";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { FormFilterItem } from "./FormFilterItem";
import { FormFilterDebug } from "./FormFilterDebug";
import { FormFiltersHeader } from "./FormFiltersHeader";
import { useFormCounts } from "@/hooks/form-filters/useFormCounts";
import { useFormFilterHandlers } from "@/hooks/form-filters/useFormFilterHandlers";

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
  const formCounts = useFormCounts(allPokemon, rawUnfilteredPokemon, getPokemonFormCategory);
  
  // Get handler functions
  const { handleToggleFilter, handleToggleAll } = useFormFilterHandlers(
    filters,
    isAllEnabled,
    toggleFilter,
    toggleAll
  );

  return (
    <div className="space-y-4">
      <FormFiltersHeader 
        isAllEnabled={isAllEnabled}
        onToggleAll={handleToggleAll}
      />
      
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
          disabled={true}
        />
      </div>
    </div>
  );
}
