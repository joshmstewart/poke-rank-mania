
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
  
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;
  
  const handleRestart = () => {
    const timestamp = new Date().toISOString();
    
    console.log(`📝 [${timestamp}] RESTART BUTTON: handleRestart triggered`);
    
    setRestartDialogOpen(false);
    console.log(`📝 [${timestamp}] RESTART BUTTON: Restart dialog closed`);
    
    if (performFullBattleReset) {
      console.log(`📝 [${timestamp}] RESTART BUTTON: Using centralized performFullBattleReset`);
      performFullBattleReset();
      console.log(`📝 [${timestamp}] RESTART BUTTON: Centralized reset completed`);
    } else {
      console.log(`📝 [${timestamp}] RESTART BUTTON: Using legacy reset method (fallback)`);
      
      localStorage.removeItem('pokemon-active-suggestions');
      console.log(`📝 [${timestamp}] RESTART BUTTON: Cleared pokemon-active-suggestions from localStorage`);
      
      localStorage.removeItem('pokemon-battle-count');
      console.log(`📝 [${timestamp}] RESTART BUTTON: Cleared pokemon-battle-count from localStorage`);
      
      localStorage.removeItem('pokemon-battle-tracking');
      console.log(`📝 [${timestamp}] RESTART BUTTON: Cleared pokemon-battle-tracking from localStorage`);
      
      if (setBattlesCompleted) {
        setBattlesCompleted(0);
        console.log(`📝 [${timestamp}] RESTART BUTTON: ✅ battlesCompleted explicitly reset to 0`);
      } else {
        console.warn(`📝 [${timestamp}] RESTART BUTTON: ⚠️ setBattlesCompleted function not provided, cannot reset React state directly`);
      }
      
      if (setBattleResults) {
        setBattleResults([]);
        console.log(`📝 [${timestamp}] RESTART BUTTON: ✅ battleResults explicitly reset to []`);
      } else {
        console.warn(`📝 [${timestamp}] RESTART BUTTON: ⚠️ setBattleResults not provided`);
      }
      
      console.log(`📝 [${timestamp}] RESTART BUTTON: Calling onRestartBattles callback`);
      onRestartBattles();
      console.log(`📝 [${timestamp}] RESTART BUTTON: onRestartBattles callback executed`);
    }
    
    setTimeout(() => {
      console.log(`📝 [${timestamp}] RESTART BUTTON: [200ms later] Current battle count:`, localStorage.getItem('pokemon-battle-count'));
    }, 200);
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
            console.log("🔍 Current battle count:", localStorage.getItem('pokemon-battle-count'));
            setRestartDialogOpen(true);
          }}
        >
          <RefreshCw className="h-4 w-4" /> Restart
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all battles, progress, rankings, and suggestions. Your battle count will return to 1. This action cannot be undone.
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
