
import React from "react";

interface GenerationHeaderProps {
  generationId: number;
  name: string;
  region: string;
  games: string;
  viewMode: "list" | "grid";
}

const GenerationHeader: React.FC<GenerationHeaderProps> = ({
  name,
  region,
  games,
  viewMode
}) => {
  return (
    <div className={`${viewMode === "grid" ? "col-span-full" : ""} bg-gradient-to-r from-primary/10 to-transparent p-2 rounded-md my-2`}>
      <h3 className="font-bold">{name}</h3>
      <p className="text-xs text-muted-foreground">
        Region: {region} | Games: {games}
      </p>
    </div>
  );
};

export default GenerationHeader;
