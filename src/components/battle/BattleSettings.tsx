
import React, { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generations } from "@/services/pokemonService";
import { BattleType } from "@/hooks/battle/types";

interface BattleSettingsProps {
  selectedGeneration: number;
  battleType: BattleType;
  fullRankingMode: boolean;
  onGenerationChange: (value: string) => void;
  onBattleTypeChange: (value: string) => void;
  onRankingModeChange: (value: boolean) => void;
}

const BattleSettings: React.FC<BattleSettingsProps> = ({
  selectedGeneration,
  battleType,
  fullRankingMode,
  onGenerationChange,
  onBattleTypeChange,
  onRankingModeChange,
}) => {
  console.log("Rendering BattleSettings with battleType:", battleType);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Battle Settings</CardTitle>
        <CardDescription>Configure your battle experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Generation</label>
            <Select value={selectedGeneration.toString()} onValueChange={onGenerationChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Generations</SelectItem>
                {generations.filter(gen => gen.id > 0).map((gen) => (
                  <SelectItem key={gen.id} value={gen.id.toString()}>
                    {gen.name} (#{gen.start}-{gen.end})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Battle Type</label>
            <ToggleGroup 
              type="single" 
              value={battleType}
              onValueChange={(value) => {
                console.log("ToggleGroup onValueChange called with:", value);
                if (value && (value === "pairs" || value === "triplets")) {
                  onBattleTypeChange(value);
                }
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="pairs" aria-label="Pairs" className="px-3 py-1 text-xs">
                Pairs (1v1)
              </ToggleGroupItem>
              <ToggleGroupItem value="triplets" aria-label="Trios" className="px-3 py-1 text-xs">
                Trios (3-way)
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="mt-2 text-xs text-muted-foreground">
              {battleType === "pairs" ? 
                "In Pairs mode, you'll compare two Pokémon at a time and select your favorite." :
                "In Trios mode, you can select any number of Pokémon (0-3) that you like from each group of three."}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Ranking Mode</label>
            <ToggleGroup 
              type="single" 
              value={fullRankingMode ? "full" : "sample"}
              onValueChange={(v) => {
                if (v) onRankingModeChange(v === "full");
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="sample" aria-label="Sample" className="px-3 py-1 text-xs">
                Sample (~150)
              </ToggleGroupItem>
              <ToggleGroupItem value="full" aria-label="Full" className="px-3 py-1 text-xs">
                Full Ranking
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="mt-2 text-xs text-muted-foreground">
              {fullRankingMode ? 
                "Full Ranking mode will include all available Pokémon in the ranking process." :
                "Sample mode uses a subset of ~150 Pokémon for faster ranking."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleSettings;
