
import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BattleDialogsProps {
  showingMilestone: boolean;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
}

const BattleDialogs: React.FC<BattleDialogsProps> = ({
  showingMilestone,
  onContinueBattles,
  onNewBattleSet
}) => {
  // We're not using this dialog anymore, using toasts instead
  return null;
};

export default BattleDialogs;
