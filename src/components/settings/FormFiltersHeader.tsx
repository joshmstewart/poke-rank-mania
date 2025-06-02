
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FormFiltersHeaderProps {
  isAllEnabled: boolean;
  onToggleAll: () => void;
}

export function FormFiltersHeader({ isAllEnabled, onToggleAll }: FormFiltersHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-medium text-sm">Pokémon Form Filters</h3>
      <div className="flex items-center space-x-2">
        <Switch 
          id="all-forms" 
          checked={isAllEnabled}
          onCheckedChange={onToggleAll} 
        />
        <Label htmlFor="all-forms" className="text-sm">All Forms</Label>
      </div>
    </div>
  );
}
