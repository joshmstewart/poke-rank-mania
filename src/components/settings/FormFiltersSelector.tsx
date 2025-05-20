
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

export function FormFiltersSelector() {
  const { 
    filters, 
    toggleFilter,
    isAllEnabled,
    toggleAll
  } = useFormFilters();
  
  // Create the ref at the component top level, not inside useEffect
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
    // This works because our loader uses the filter hook which has changed
    window.location.reload();
  }, [filters]);

  return (
    <div className="space-y-4 p-4 border rounded-md bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Pokemon Form Filters</h3>
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
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="mega" 
            checked={filters.mega}
            onCheckedChange={() => toggleFilter("mega")} 
          />
          <Label htmlFor="mega" className="text-sm">Mega Evolutions</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="regional" 
            checked={filters.regional}
            onCheckedChange={() => toggleFilter("regional")} 
          />
          <Label htmlFor="regional" className="text-sm">Regional Variants</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="gender" 
            checked={filters.gender}
            onCheckedChange={() => toggleFilter("gender")} 
          />
          <Label htmlFor="gender" className="text-sm">Gender Differences</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="forms" 
            checked={filters.forms}
            onCheckedChange={() => toggleFilter("forms")} 
          />
          <Label htmlFor="forms" className="text-sm">Special Forms</Label>
        </div>
      </div>
    </div>
  );
}
