
import React from "react";
import { useFormFilters } from "@/hooks/useFormFilters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export type PokemonFormType = 
  | "mega" 
  | "regional" 
  | "gender" 
  | "forms";

// Image URLs for different form types
const formExampleImages = {
  mega: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png", // Mega Charizard Y
  regional: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png", // Alolan Muk
  gender: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/593.png", // Female Jellicent
  forms: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10120.png", // Hoopa Unbound
};

export function FormFiltersSelector() {
  const { 
    filters, 
    toggleFilter,
    isAllEnabled,
    toggleAll
  } = useFormFilters();
  
  // Create the ref at the component top level
  const isFirstRender = React.useRef(true);

  // Effect to reload pokemon when filters change
  React.useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Inform user that filters have changed
    toast({
      title: "Form filters updated",
      description: "The Pokemon list has been filtered according to your preferences.",
    });

    // Force a reload of the component to apply filters
    window.location.reload();
  }, [filters]);

  return (
    <div className="space-y-4 p-4 border rounded-md bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Pokémon Form Filters</h3>
        <div className="flex items-center space-x-2">
          <Switch 
            id="all-forms" 
            checked={isAllEnabled}
            onCheckedChange={toggleAll} 
          />
          <Label htmlFor="all-forms" className="text-sm">All Forms</Label>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        {/* Mega Evolutions */}
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.mega} alt="Mega Form" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <Label htmlFor="mega" className="text-sm">Mega Evolutions</Label>
            <Switch 
              id="mega" 
              checked={filters.mega}
              onCheckedChange={() => toggleFilter("mega")} 
            />
          </div>
        </div>
        
        {/* Regional Variants */}
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.regional} alt="Regional Form" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <Label htmlFor="regional" className="text-sm">Regional Variants</Label>
            <Switch 
              id="regional" 
              checked={filters.regional}
              onCheckedChange={() => toggleFilter("regional")} 
            />
          </div>
        </div>
        
        {/* Gender Differences */}
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.gender} alt="Gender Form" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <Label htmlFor="gender" className="text-sm">Gender Differences</Label>
            <Switch 
              id="gender" 
              checked={filters.gender}
              onCheckedChange={() => toggleFilter("gender")} 
            />
          </div>
        </div>
        
        {/* Special Forms */}
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img src={formExampleImages.forms} alt="Special Form" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <Label htmlFor="forms" className="text-sm">Special Forms</Label>
            <Switch 
              id="forms" 
              checked={filters.forms}
              onCheckedChange={() => toggleFilter("forms")} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
