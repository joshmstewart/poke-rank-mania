
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerationHeaderProps {
  generationId: number;
  name: string;
  region: string;
  games: string;
  viewMode: "list" | "grid";
  isExpanded: boolean;
  onToggle: () => void;
}

const GenerationHeader: React.FC<GenerationHeaderProps> = ({
  name,
  region,
  games,
  viewMode,
  isExpanded,
  onToggle
}) => {
  return (
    <div className={`${viewMode === "grid" ? "col-span-full" : ""} bg-card rounded-lg my-2 border border-border shadow-sm hover:shadow-md transition-shadow`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50"
      >
        <div className="flex flex-col items-start">
          <h3 className="font-semibold text-foreground text-left text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground text-left">
            {region} • {games}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

export default GenerationHeader;
