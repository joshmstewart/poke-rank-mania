
import React from "react";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { generations } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";

interface RankingControlsProps {
  selectedGeneration: number;
  loadingType: LoadingType;
  loadSize: number;
  onGenerationChange: (value: string) => void;
  onLoadingTypeChange: (value: string) => void;
  onLoadSizeChange: (value: string) => void;
  loadSizeOptions: number[];
}

export const RankingControls: React.FC<RankingControlsProps> = ({
  selectedGeneration,
  loadingType,
  loadSize,
  onGenerationChange,
  onLoadingTypeChange,
  onLoadSizeChange,
  loadSizeOptions,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="w-64">
        <Select value={selectedGeneration.toString()} onValueChange={onGenerationChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Generation" />
          </SelectTrigger>
          <SelectContent>
            {generations.map((gen) => (
              <SelectItem key={gen.id} value={gen.id.toString()}>
                {gen.name} {gen.id === 0 ? (
                  <span className="text-green-600 ml-2">(Loadable)</span>
                ) : (
                  <span>(#{gen.start}-{gen.end})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedGeneration === 0 && (
        <>
          <div className="w-64">
            <Select value={loadingType} onValueChange={onLoadingTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Loading Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infinite">Infinite Scroll</SelectItem>
                <SelectItem value="pagination">Pagination</SelectItem>
                <SelectItem value="single">Single Load</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loadingType === "single" && (
            <div className="w-64">
              <Select value={loadSize.toString()} onValueChange={onLoadSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Load Size" />
                </SelectTrigger>
                <SelectContent>
                  {loadSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      Load {size} Pokémon
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
};
