
import React from "react";
import { useSessionManager, BattleSessionData } from "@/hooks/useSessionManager";
import SessionManager from "./SessionManager";

interface BattleHeaderProps {
  importSessionCallback: (sessionData: BattleSessionData) => void;
}

const BattleHeader: React.FC<BattleHeaderProps> = ({ importSessionCallback }) => {
  const { exportSessionData, importSessionData } = useSessionManager(importSessionCallback);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold mb-1">Battle Mode</h1>
        <p className="text-muted-foreground">
          Compare Pokémon head-to-head to create your personal ranking
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <SessionManager onExport={exportSessionData} onImport={importSessionData} />
      </div>
    </div>
  );
};

export default BattleHeader;
