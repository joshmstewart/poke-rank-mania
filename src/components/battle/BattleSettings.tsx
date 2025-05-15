
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BattleType } from "@/hooks/battle/types";
import { generations } from "@/services/pokemon";

interface BattleSettingsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
}

const BattleSettings: React.FC<BattleSettingsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange
}) => {
  return (
    <div className="flex flex-row gap-4 items-center w-full">
      {/* Generation selector */}
      <div className="flex-1">
        <label className="text-sm font-medium block mb-1">Generation</label>
        <Select 
          value={selectedGeneration.toString()} 
          onValueChange={onGenerationChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a generation" />
          </SelectTrigger>
          <SelectContent>
            {generations.map(gen => (
              <SelectItem key={gen.id} value={gen.id.toString()}>
                {gen.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Battle Type selector */}
      <div className="flex-1">
        <label className="text-sm font-medium block mb-1">Battle Type</label>
        <Select
          value={battleType}
          onValueChange={(value: BattleType) => onBattleTypeChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select battle type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pairs">Pairs</SelectItem>
            <SelectItem value="triplets">Trios</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BattleSettings;
