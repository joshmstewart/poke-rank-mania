
import React from "react";

interface BattleHeaderProps {
  battlesCompleted?: number;
  battleType?: string;
  completionPercentage?: number;
}

const BattleHeader: React.FC<BattleHeaderProps> = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-muted-foreground">
          Compare Pokémon head-to-head to create your personal ranking
        </p>
      </div>
    </div>
  );
};

export default BattleHeader;
