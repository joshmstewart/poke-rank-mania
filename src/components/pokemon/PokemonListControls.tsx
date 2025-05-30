
import React from "react";
import { Search, List, Grid, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PokemonListControlsProps {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (value: "list" | "grid") => void;
  showCollapseAll?: boolean;
  allExpanded?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  hideSearch?: boolean;
}

const PokemonListControls: React.FC<PokemonListControlsProps> = ({
  title,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showCollapseAll = false,
  allExpanded = false,
  onExpandAll,
  onCollapseAll,
  hideSearch = false
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && onViewModeChange(value as "list" | "grid")}
        >
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        {showCollapseAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={allExpanded ? onCollapseAll : onExpandAll}
            className="flex items-center gap-1"
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Expand All
              </>
            )}
          </Button>
        )}
      </div>
      {!hideSearch && (
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Pokemon..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default PokemonListControls;
