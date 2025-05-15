
import React from "react";
import Logo from "@/components/ui/Logo";

const BattleHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <Logo />
        <p className="text-muted-foreground mt-2">
          Compare Pokémon head-to-head to create your personal ranking
        </p>
      </div>
    </div>
  );
};

export default BattleHeader;
