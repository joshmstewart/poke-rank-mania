
import React from "react";

export const RankingInfoPanel: React.FC = () => {
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-md">
      <h3 className="text-sm font-medium mb-2">About TrueSkill™ Rankings</h3>
      <p className="text-sm text-gray-600">
        Rankings use the TrueSkill™ Bayesian rating system, similar to what Xbox Live uses for matchmaking.
        Each Pokémon has a skill rating (μ) and uncertainty (σ). The displayed score is a conservative estimate (μ - 3σ),
        and the confidence increases as more battles are completed.
      </p>
    </div>
  );
};
