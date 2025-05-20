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
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

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
  const { resetMilestones, resetMilestoneRankings } = useBattleStateCore();

  const handleRestart = () => {
    resetMilestones();
    resetMilestoneRankings();  // ✅ Important fix: ensures milestone rankings reset properly
    onConfirmRestart();
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
