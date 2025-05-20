
import React from "react";
import { useGenerationSettings } from "@/hooks/battle/useGenerationSettings";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generations } from "@/services/pokemon";
import { FormFiltersSelector } from "@/components/settings/FormFiltersSelector";

interface BattleSettingsProps {
  onGenerationChange: (genId: number) => void;
  onBattleTypeChange: (type: "pairs" | "triplets") => void;
  selectedGeneration: number;
  battleType: "pairs" | "triplets";
}

const BattleSettings: React.FC<BattleSettingsProps> = ({ 
  onGenerationChange, 
  onBattleTypeChange, 
  selectedGeneration,
  battleType
}) => {
  const { generationName } = useGenerationSettings(selectedGeneration);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-medium">Battle Type</h3>
        <ToggleGroup 
          type="single" 
          value={battleType}
          onValueChange={(value) => {
            if (value) onBattleTypeChange(value as "pairs" | "triplets");
          }} 
          className="justify-start"
        >
          <ToggleGroupItem value="pairs" aria-label="Pair battles">
            Pairs
          </ToggleGroupItem>
          <ToggleGroupItem value="triplets" aria-label="Triplet battles">
            Triplets
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium">Generation</h3>
        <Select 
          value={selectedGeneration.toString()}
          onValueChange={(value) => onGenerationChange(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select generation" />
          </SelectTrigger>
          <SelectContent>
            {generations.map((gen) => (
              <SelectItem key={gen.id} value={gen.id.toString()}>
                {gen.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />
      
      {/* Form filters component */}
      <FormFiltersSelector />
    </div>
  );
};

export default BattleSettings;
