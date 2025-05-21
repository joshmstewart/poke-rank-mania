
import React from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface RankingHeaderProps {
  title: string;
  displayCount: number;
  totalCount: number;
  isMilestoneView: boolean;
  battlesCompleted: number;
  rankingGenerated: boolean;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  onSaveRankings: () => void;
}

const RankingHeader: React.FC<RankingHeaderProps> = ({
  title,
  displayCount,
  totalCount,
  isMilestoneView,
  battlesCompleted,
  rankingGenerated,
  onContinueBattles,
  onNewBattleSet,
  onSaveRankings
}) => {
  return (
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        {isMilestoneView ? `Milestone: ${battlesCompleted} Battles` : title}
        <span className="text-sm font-normal text-muted-foreground ml-2">
          (Showing {displayCount} of {totalCount})
        </span>
      </h2>
      <div className="flex gap-2">
        <Button onClick={onContinueBattles} variant="default">Continue Battles</Button>
        {!isMilestoneView && rankingGenerated && (
          <Button onClick={onNewBattleSet} variant="outline">Start New Battle Set</Button>
        )}
        {!isMilestoneView && rankingGenerated && (
          <Button onClick={onSaveRankings} variant="outline">Save Rankings</Button>
        )}
      </div>
    </div>
  );
};

export default RankingHeader;
