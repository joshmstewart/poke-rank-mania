
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
    <div className="space-y-2 mb-3">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-1">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      
      {/* Controls Row */}
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-700">View:</span>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && onViewModeChange(value as "list" | "grid")}
                className="border border-gray-200"
              >
                <ToggleGroupItem 
                  value="list" 
                  aria-label="List view"
                  className="h-6 w-6 p-0 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                >
                  <List className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="grid" 
                  aria-label="Grid view"
                  className="h-6 w-6 p-0 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                >
                  <Grid className="h-3 w-3" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {showCollapseAll && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={allExpanded ? onCollapseAll : onExpandAll}
                  className="h-6 px-2 text-xs flex items-center gap-1 hover:bg-gray-50"
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
              </div>
            )}
          </div>
          
          {!hideSearch && (
            <div className="relative w-20">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search"
                className="h-6 pl-6 text-xs py-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
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
