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
  return (
    <>
      <Dialog open={showingMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Milestone Reached!</DialogTitle>
          </DialogHeader>
          <p>You've hit a ranking milestone. Continue battling or start a new set?</p>
          <DialogFooter>
            <Button variant="default" onClick={onContinueBattles}>
              Continue Battles
            </Button>
            <Button variant="outline" onClick={onNewBattleSet}>
              New Battle Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BattleDialogs;
