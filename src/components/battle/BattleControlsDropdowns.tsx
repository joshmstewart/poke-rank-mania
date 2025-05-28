
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BattleType } from "@/hooks/battle/types";
import { generations } from "@/services/pokemon";

interface BattleControlsDropdownsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
}

const BattleControlsDropdowns: React.FC<BattleControlsDropdownsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange
}) => {
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;

  return (
    <div className="flex items-center gap-8">
      <div className="flex items-center">
        <span className="text-sm font-medium whitespace-nowrap mr-2">Gen:</span>
        <Select 
          value={safeSelectedGeneration.toString()} 
          onValueChange={(value) => {
            console.log("🔍 Generation dropdown changed to:", value);
            onGenerationChange(value);
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Generation" />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[200px]">
            {generations.map(gen => (
              <SelectItem key={gen.id} value={gen.id.toString()}>
                {gen.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center">
        <span className="text-sm font-medium whitespace-nowrap mr-2">Mode:</span>
        <Select
          value={battleType}
          onValueChange={(value: BattleType) => {
            console.log("🔍 Battle type dropdown changed to:", value);
            onBattleTypeChange(value);
          }}
        >
          <SelectTrigger className="w-[100px] h-8 text-sm flex items-center">
            <SelectValue placeholder="Battle Type" className="py-0" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="pairs">Pairs</SelectItem>
            <SelectItem value="triplets">Trios</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BattleControlsDropdowns;
