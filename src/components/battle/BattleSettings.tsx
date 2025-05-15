
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Battle Settings</CardTitle>
        <CardDescription>Configure your battle experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="generation" className="mb-2 block">Generation</Label>
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
            <Label className="mb-2 block">Battle Type</Label>
            <RadioGroup value={battleType} onValueChange={onBattleTypeChange} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pairs" id="pairs" />
                <Label htmlFor="pairs">
                  Pairs (1v1) - Compare two Pokémon at a time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="triplets" id="triplets" />
                <Label htmlFor="triplets">
                  Triplets (3-way) - Compare three Pokémon at a time (faster)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label className="mb-2 block">Ranking Mode</Label>
            <RadioGroup 
              value={fullRankingMode ? "full" : "sample"} 
              onValueChange={(v) => onRankingModeChange(v === "full")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sample" id="sample" />
                <Label htmlFor="sample">
                  Sample (~150 Pokémon) - Faster experience
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">
                  Full Ranking - All Pokémon in selected generation
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleSettings;
