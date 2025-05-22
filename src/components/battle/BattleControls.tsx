
import React, { useState, useEffect } from "react";
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

interface BattleControlsProps {
  selectedGeneration: number;
  battleType: BattleType;
  onGenerationChange: (generation: string) => void;
  onBattleTypeChange: (type: BattleType) => void;
  onRestartBattles: () => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
  performFullBattleReset?: () => void; // ✅ Add the new centralized reset function prop
}

const BattleControls: React.FC<BattleControlsProps> = ({
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
  // Ensure selectedGeneration has a valid value (defaulting to 0 if undefined)
  const safeSelectedGeneration = selectedGeneration !== undefined ? selectedGeneration : 0;
  
  // Debug logging for initial values
  useEffect(() => {
    console.log("🔍 BattleControls mounted:", {
      selectedGeneration: safeSelectedGeneration,
      battleType,
      battlesCompleted: localStorage.getItem('pokemon-battle-count')
    });
  }, [safeSelectedGeneration, battleType]);
  
  const handleRestart = () => {
    // Timestamp for tracking the entire process
    const timestamp = new Date().toISOString();
    
    // Debug logging with timestamp
    console.log(`📝 [${timestamp}] RESTART BUTTON: handleRestart triggered`);
    
    // Close dialog first
    setRestartDialogOpen(false);
    console.log(`📝 [${timestamp}] RESTART BUTTON: Restart dialog closed`);
    
    // Use the new centralized reset function if available
    if (performFullBattleReset) {
      console.log(`📝 [${timestamp}] RESTART BUTTON: Using centralized performFullBattleReset`);
      performFullBattleReset();
      console.log(`📝 [${timestamp}] RESTART BUTTON: Centralized reset completed`);
    } else {
      // Legacy fallback for backward compatibility
      console.log(`📝 [${timestamp}] RESTART BUTTON: Using legacy reset method (fallback)`);
      
      // ✅ Clear suggestion arrows explicitly on restart
      localStorage.removeItem('pokemon-active-suggestions');
      console.log(`📝 [${timestamp}] RESTART BUTTON: Cleared pokemon-active-suggestions from localStorage`);
      
      // ✅ Clear battle count explicitly
      localStorage.removeItem('pokemon-battle-count');
      console.log(`📝 [${timestamp}] RESTART BUTTON: Cleared pokemon-battle-count from localStorage`);
      
      // Additional reset of battle counter related items
      localStorage.removeItem('pokemon-battle-tracking');
      console.log(`📝 [${timestamp}] RESTART BUTTON: Cleared pokemon-battle-tracking from localStorage`);
      
      // CRITICAL STEP: Explicitly reset battlesCompleted state in React
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
      
      // Call the original restart handler
      console.log(`📝 [${timestamp}] RESTART BUTTON: Calling onRestartBattles callback`);
      onRestartBattles();
      console.log(`📝 [${timestamp}] RESTART BUTTON: onRestartBattles callback executed`);
    }
    
    // Check state after 200ms to see if changes persisted
    setTimeout(() => {
      console.log(`📝 [${timestamp}] RESTART BUTTON: [200ms later] Current battle count:`, localStorage.getItem('pokemon-battle-count'));
    }, 200);
  };
  
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border w-full">
      {/* Left side - Gen and Mode dropdowns */}
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
      
      {/* Right side - action buttons with proper spacing */}
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
    </div>
  );
};

export default BattleControls;
