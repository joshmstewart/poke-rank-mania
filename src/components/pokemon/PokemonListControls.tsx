
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
    <div className="space-y-4 mb-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      
      {/* Controls Row */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-700 mr-2">View:</span>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && onViewModeChange(value as "list" | "grid")}
                className="border border-gray-200"
              >
                <ToggleGroupItem 
                  value="list" 
                  aria-label="List view"
                  className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                >
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="grid" 
                  aria-label="Grid view"
                  className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                >
                  <Grid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {showCollapseAll && (
              <div className="border-l border-gray-200 pl-3 ml-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={allExpanded ? onCollapseAll : onExpandAll}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  {allExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Expand All
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {!hideSearch && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Pokémon..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PokemonListControls;
