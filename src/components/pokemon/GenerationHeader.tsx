
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
    <div className={`${viewMode === "grid" ? "col-span-full" : ""} bg-white rounded-lg my-2 border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50"
      >
        <div className="flex flex-col items-start">
          <h3 className="font-semibold text-gray-900 text-left">{name}</h3>
          <p className="text-sm text-gray-600 text-left">
            {region} • {games}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </Button>
    </div>
  );
};

export default GenerationHeader;
