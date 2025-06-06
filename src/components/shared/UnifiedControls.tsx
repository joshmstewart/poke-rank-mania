import React, { useState } from "react";
import { RefreshCw, Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BattleType } from "@/hooks/battle/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BattleSettings from "../battle/BattleSettings";
import CombinedRankingsModal from "../rankings/CombinedRankingsModal";
import { generations } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "sonner";

interface UnifiedControlsProps {
  selectedGeneration: number;
  battleType?: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange?: (type: BattleType) => void;
  showBattleTypeControls?: boolean;
  mode: "battle" | "manual";
  onReset?: () => void;
  customResetAction?: () => void;
}

const UnifiedControls: React.FC<UnifiedControlsProps> = ({
  selectedGeneration,
  battleType = "pairs",
  onGenerationChange,
  onBattleTypeChange,
  showBattleTypeControls = false,
  mode,
  onReset,
  customResetAction
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const { clearAllRatings } = useTrueSkillStore();
  
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;
  
  const handleUnifiedReset = () => {
    console.log(`🔄 [UNIFIED_RESET] ===== COMPLETE RESET INITIATED FROM ${mode.toUpperCase()} MODE =====`);
    
    setRestartDialogOpen(false);
    
    // STEP 1: Clear centralized TrueSkill store FIRST
    console.log(`🔄 [UNIFIED_RESET] Clearing TrueSkill store`);
    clearAllRatings();
    
    // STEP 2: Clear ALL localStorage
    const keysToRemove = [
      'pokemon-battle-count',
      'pokemon-battle-results',
      'pokemon-battle-history',
      'pokemon-battle-recently-used',
      'pokemon-battle-last-battle',
      'pokemon-ranker-battle-history',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'pokemon-active-suggestions',
      'suggestionUsageCounts',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    // Also clear generation-specific manual rankings
    for (let gen = 0; gen <= 9; gen++) {
      keysToRemove.push(`manual-rankings-gen-${gen}`);
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 [UNIFIED_RESET] Cleared: ${key}`);
    });
    
    // STEP 3: Call custom reset action if provided (for mode-specific cleanup)
    if (customResetAction) {
      console.log(`🔄 [UNIFIED_RESET] Calling custom reset action for ${mode} mode`);
      customResetAction();
    }
    
    // STEP 4: Call legacy reset if provided
    if (onReset) {
      onReset();
    }
    
    // STEP 5: Dispatch events to notify all components
    setTimeout(() => {
      const clearEvent = new CustomEvent('trueskill-store-cleared');
      document.dispatchEvent(clearEvent);
      
      const resetEvent = new CustomEvent('battle-system-reset', {
        detail: { timestamp: Date.now(), source: `unified-reset-${mode}` }
      });
      document.dispatchEvent(resetEvent);
      
      console.log(`🔄 [UNIFIED_RESET] Reset events dispatched`);
    }, 50);
    
    toast.success("Complete Reset", {
      description: "All battle data, rankings, and TrueSkill ratings completely cleared across both modes!"
    });
    
    console.log(`🔄 [UNIFIED_RESET] ===== COMPLETE RESET FINISHED =====`);
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow border w-full">
      <div className="flex items-center gap-8">
        {/* Generation Selector */}
        <div className="flex items-center" data-tour="generation-filter">
          <span className="text-sm font-medium whitespace-nowrap mr-2">Gen:</span>
          <Select 
            value={safeSelectedGeneration.toString()} 
            onValueChange={(value) => {
              console.log(`🔍 Generation changed to: ${value} in ${mode} mode`);
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
      </div>

      <div className="flex items-center gap-4">
        {/* Rankings Button */}
        <CombinedRankingsModal 
          open={rankingsOpen} 
          onOpenChange={setRankingsOpen}
          selectedGeneration={safeSelectedGeneration}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-8 text-sm px-4 min-w-[100px]"
            data-tour="rankings-button"
          >
            <Trophy className="h-4 w-4" /> Rankings
          </Button>
        </CombinedRankingsModal>

        {/* Settings Button (Forms) */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-sm px-4 min-w-[90px]"
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
                console.log(`🔍 Settings: onGenerationChange called with: ${genId}`);
                onGenerationChange(genId.toString());
                setSettingsOpen(false);
              }}
              onBattleTypeChange={(type) => {
                console.log(`🔍 Settings: onBattleTypeChange called with: ${type}`);
                if (onBattleTypeChange) onBattleTypeChange(type);
                setSettingsOpen(false);
              }}
              selectedGeneration={safeSelectedGeneration}
              battleType={battleType}
            />
          </DialogContent>
        </Dialog>
        
        {/* Restart Button */}
        <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-8 text-sm px-4"
            onClick={() => {
              console.log(`🔍 Restart button clicked in ${mode} mode`);
              setRestartDialogOpen(true);
            }}
          >
            <RefreshCw className="h-4 w-4" /> Restart
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
              <AlertDialogDescription>
                This will completely reset ALL battles, progress, rankings, TrueSkill ratings, and suggestions across both Battle Mode and Manual Mode. All data will be permanently cleared and you'll start completely fresh. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                console.log(`🔍 Restart cancelled in ${mode} mode`);
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  console.log(`🔍 Restart confirmed in ${mode} mode`);
                  handleUnifiedReset();
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Restart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default UnifiedControls;
