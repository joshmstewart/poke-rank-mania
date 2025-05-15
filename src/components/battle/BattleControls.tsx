
import React from "react";
import { List, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BattleType } from "@/hooks/battle/types";
import { generations } from "@/services/pokemon";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onViewRankings: () => void;
  onOpenRestartDialog: () => void;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onViewRankings,
  onOpenRestartDialog
}) => {
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border">
      {/* Left side - Gen and Mode dropdowns */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <span className="text-sm font-medium whitespace-nowrap mr-1">Gen:</span>
          <Select 
            value={selectedGeneration.toString()} 
            onValueChange={onGenerationChange}
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Generation" className="text-left" />
            </SelectTrigger>
            <SelectContent align="start">
              {generations.map(gen => (
                <SelectItem key={gen.id} value={gen.id.toString()}>
                  {gen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium whitespace-nowrap mr-1">Mode:</span>
          <Select
            value={battleType}
            onValueChange={(value: BattleType) => onBattleTypeChange(value)}
          >
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue placeholder="Battle Type" className="text-left" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="pairs">Pairs</SelectItem>
              <SelectItem value="triplets">Trios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Right side - action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 text-sm"
          onClick={onViewRankings}
        >
          <List className="h-4 w-4" /> Rankings
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 text-sm"
          onClick={onOpenRestartDialog}
        >
          <RefreshCw className="h-4 w-4" /> Restart
        </Button>
      </div>
    </div>
  );
};

export default BattleControls;
