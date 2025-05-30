
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
    <div className={`${viewMode === "grid" ? "col-span-full" : ""} bg-gradient-to-r from-primary/10 to-transparent rounded-md my-2 border border-gray-200`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 h-auto hover:bg-primary/5"
      >
        <div className="flex flex-col items-start">
          <h3 className="font-bold text-left">{name}</h3>
          <p className="text-xs text-muted-foreground text-left">
            Region: {region} | Games: {games}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
};

export default GenerationHeader;
