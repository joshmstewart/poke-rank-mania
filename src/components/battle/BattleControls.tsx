
import React, { useState } from "react";
import { List, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BattleType } from "@/hooks/battle/types";
import { generations } from "@/services/pokemon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import BattleSettings from "./BattleSettings";

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onRestartBattles
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Ensure selectedGeneration has a valid value (defaulting to 0 if undefined)
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;
  
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border">
      {/* Left side - Gen and Mode dropdowns */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <span className="text-sm font-medium whitespace-nowrap mr-1">Gen:</span>
          <Select 
            value={safeSelectedGeneration.toString()} 
            onValueChange={onGenerationChange}
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
          <span className="text-sm font-medium whitespace-nowrap mr-1">Mode:</span>
          <Select
            value={battleType}
            onValueChange={(value: BattleType) => onBattleTypeChange(value)}
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
      
      {/* Right side - action buttons */}
      <div className="flex gap-2">
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-sm"
            >
              <Settings className="h-4 w-4" /> Forms
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pokémon Form Settings</DialogTitle>
            </DialogHeader>
            <BattleSettings
              onGenerationChange={(genId) => {
                onGenerationChange(genId.toString());
                setSettingsOpen(false);
              }}
              onBattleTypeChange={(type) => {
                onBattleTypeChange(type);
                setSettingsOpen(false);
              }}
              selectedGeneration={safeSelectedGeneration}
              battleType={battleType}
            />
          </DialogContent>
        </Dialog>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 text-sm"
          onClick={onRestartBattles}
        >
          <RefreshCw className="h-4 w-4" /> Restart
        </Button>
      </div>
    </div>
  );
};

export default BattleControls;
