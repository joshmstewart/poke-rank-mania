
import React from "react";
import Logo from "@/components/ui/Logo";

const BattleHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold mb-1">Battle Mode</h1>
        <p className="text-muted-foreground">
          Compare Pokémon head-to-head to create your personal ranking
        </p>
      </div>
    </div>
  );
};

export default BattleHeader;
