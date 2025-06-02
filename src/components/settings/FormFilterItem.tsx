
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PokemonFormType } from "@/hooks/form-filters/types";
import { formExampleImages } from "./formFilterData";
import { getFilterName } from "./formFilterHelpers";

interface FormFilterItemProps {
  filter: PokemonFormType;
  isEnabled: boolean;
  count: number;
  onToggle: (filter: PokemonFormType) => void;
  extraDescription?: string;
  disabled?: boolean;
}

export function FormFilterItem({ 
  filter, 
  isEnabled, 
  count, 
  onToggle, 
  extraDescription,
  disabled = false
}: FormFilterItemProps) {
  const handleToggle = () => {
    if (!disabled) {
      onToggle(filter);
    }
  };
  
  return (
    <div className="flex items-center space-x-3">
      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
        <img 
          src={formExampleImages[filter]} 
          alt={getFilterName(filter)} 
          className={`h-8 w-8 object-contain ${filter === 'blocked' ? 'grayscale' : ''}`} 
        />
      </div>
      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <Label htmlFor={filter} className={`text-sm ${disabled ? 'text-muted-foreground' : ''}`}>
            {getFilterName(filter)}
          </Label>
          <span className="text-xs text-muted-foreground">
            {count} Pokemon{extraDescription ? ` ${extraDescription}` : ''}
            {disabled && ' (always disabled)'}
          </span>
        </div>
        <Switch 
          id={filter} 
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
