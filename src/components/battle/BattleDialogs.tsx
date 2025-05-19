import React from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore"; // ✅ import the hook

interface BattleDialogsProps {
  isRestartDialogOpen: boolean;
  onRestartDialogChange: (open: boolean) => void;
  onConfirmRestart: () => void;
}

const BattleDialogs: React.FC<BattleDialogsProps> = ({
  isRestartDialogOpen,
  onRestartDialogChange,
  onConfirmRestart
}) => {
  const { resetMilestones } = useBattleStateCore(); // ✅ get resetMilestones

  // Wrap the restart handler to include milestone reset
  const handleRestart = () => {
    resetMilestones();             // ✅ reset milestone snapshots and confidence state
    onConfirmRestart();            // 🔁 call parent-provided logic (e.g. clearing history/results)
  };

  return (
    <AlertDialog open={isRestartDialogOpen} onOpenChange={onRestartDialogChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your current battle progress and rankings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestart}>
            Yes, restart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BattleDialogs;
