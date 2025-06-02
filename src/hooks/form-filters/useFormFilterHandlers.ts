
import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { PokemonFormType, FormFilters } from "./types";
import { getFilterName } from "@/components/settings/formFilterHelpers";

export const useFormFilterHandlers = (
  filters: FormFilters,
  isAllEnabled: boolean,
  toggleFilter: (filter: PokemonFormType) => void,
  toggleAll: () => void
) => {
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

  return {
    handleToggleFilter,
    handleToggleAll
  };
};
