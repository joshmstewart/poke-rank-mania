
import React from "react";
import PokemonListControls from "@/components/pokemon/PokemonListControls";

interface AvailablePokemonControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (value: "list" | "grid") => void;
  allExpanded: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const AvailablePokemonControls: React.FC<AvailablePokemonControlsProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  allExpanded,
  onExpandAll,
  onCollapseAll
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <PokemonListControls
        title=""
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        showCollapseAll={true}
        allExpanded={allExpanded}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
      />
    </div>
  );
};
