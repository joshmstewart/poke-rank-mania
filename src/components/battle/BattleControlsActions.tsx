
import React, { useState } from "react";
import { RefreshCw, Settings } from "lucide-react";
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
import BattleSettings from "./BattleSettings";
import { SingleBattle } from "@/hooks/battle/types";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "@/hooks/use-toast";

interface BattleControlsActionsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  performFullBattleReset?: () => void;
}

const BattleControlsActions: React.FC<BattleControlsActionsProps> = ({
  selectedGeneration,
  battleType,
  onGenerationChange,
  onBattleTypeChange,
  onRestartBattles,
  setBattlesCompleted,
  setBattleResults,
  performFullBattleReset
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const { clearAllRatings } = useTrueSkillStore();
  
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;
  
  const handleRestart = () => {
    const timestamp = new Date().toISOString();
    
    console.log(`🔄 [RESTART_FIXED] ===== COMPREHENSIVE RESTART INITIATED =====`);
    console.log(`🔄 [RESTART_FIXED] Timestamp: ${timestamp}`);
    
    setRestartDialogOpen(false);
    
    // Step 1: Clear TrueSkill store first (this affects Manual Mode)
    console.log(`🔄 [RESTART_FIXED] Step 1: Clearing TrueSkill store`);
    clearAllRatings();
    
    // Step 2: Clear all localStorage items
    console.log(`🔄 [RESTART_FIXED] Step 2: Clearing localStorage`);
    const keysToRemove = [
      'pokemon-active-suggestions',
      'pokemon-battle-count',
      'pokemon-battle-results',
      'pokemon-battle-tracking',
      'pokemon-battle-history',
      'pokemon-battles-completed',
      'pokemon-battle-seen',
      'suggestionUsageCounts',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 [RESTART_FIXED] Cleared: ${key}`);
    });
    
    // Step 3: Reset React state
    console.log(`🔄 [RESTART_FIXED] Step 3: Resetting React state`);
    if (setBattlesCompleted) {
      setBattlesCompleted(0);
      console.log(`🔄 [RESTART_FIXED] ✅ Battles completed reset to 0`);
    }
    
    if (setBattleResults) {
      setBattleResults([]);
      console.log(`🔄 [RESTART_FIXED] ✅ Battle results reset to []`);
    }
    
    // Step 4: Use centralized reset if available
    if (performFullBattleReset) {
      console.log(`🔄 [RESTART_FIXED] Step 4: Using centralized reset`);
      performFullBattleReset();
    } else {
      console.log(`🔄 [RESTART_FIXED] Step 4: Using legacy reset callback`);
      onRestartBattles();
    }
    
    // Step 5: Dispatch events to notify other components
    console.log(`🔄 [RESTART_FIXED] Step 5: Dispatching reset events`);
    setTimeout(() => {
      // Notify Manual Mode
      const manualModeEvent = new CustomEvent('trueskill-store-cleared');
      document.dispatchEvent(manualModeEvent);
      
      // General reset event
      const resetEvent = new CustomEvent('battle-system-reset', {
        detail: { timestamp, source: 'restart-button' }
      });
      document.dispatchEvent(resetEvent);
      
      console.log(`🔄 [RESTART_FIXED] ✅ Events dispatched`);
    }, 50);
    
    // Step 6: Show success toast
    toast({
      title: "Battles Restarted",
      description: "All battles, rankings, and progress have been completely reset.",
      duration: 3000
    });
    
    console.log(`🔄 [RESTART_FIXED] ===== RESTART COMPLETE =====`);
  };

  return (
    <div className="flex items-center">
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-8 text-sm px-4 min-w-[90px] mr-4"
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
              console.log("🔍 BattleSettings: onGenerationChange called with:", genId);
              onGenerationChange(genId.toString());
              setSettingsOpen(false);
            }}
            onBattleTypeChange={(type) => {
              console.log("🔍 BattleSettings: onBattleTypeChange called with:", type);
              onBattleTypeChange(type);
              setSettingsOpen(false);
            }}
            selectedGeneration={safeSelectedGeneration}
            battleType={battleType}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 text-sm px-4"
          onClick={() => {
            console.log("🔍 Restart button clicked - opening confirmation dialog");
            setRestartDialogOpen(true);
          }}
        >
          <RefreshCw className="h-4 w-4" /> Restart
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will completely reset all battles, progress, rankings, and suggestions across both Battle Mode and Manual Mode. Your battle count will return to 1 and all rankings will be cleared. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              console.log("🔍 Restart cancelled");
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("🔍 Restart confirmed through dialog");
                handleRestart();
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BattleControlsActions;
