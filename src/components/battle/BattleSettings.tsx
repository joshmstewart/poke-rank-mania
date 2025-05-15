
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BattleType } from "@/hooks/battle/types";
import { RefreshCw } from "lucide-react";
import { generations } from "@/services/pokemon";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

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
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-2">Battle Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Generation selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Generation</label>
            <Select 
              value={selectedGeneration.toString()} 
              onValueChange={onGenerationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a generation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Generations</SelectItem>
                {generations.map(gen => (
                  <SelectItem key={gen.id} value={gen.id.toString()}>
                    {gen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Battle Type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Battle Type</label>
            <RadioGroup 
              value={battleType}
              onValueChange={(value: BattleType) => onBattleTypeChange(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pairs" id="pairs" />
                <Label htmlFor="pairs">Pairs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="triplets" id="triplets" />
                <Label htmlFor="triplets">Trios</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Reset button */}
          <div className="md:col-span-2">
            <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" /> Restart Battles
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your current battle progress and rankings.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      onGenerationChange(selectedGeneration.toString());
                      setRestartDialogOpen(false);
                    }}
                  >
                    Yes, restart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BattleSettings;
