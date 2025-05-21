
import React from "react";
import { Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNOption } from "@/services/pokemon";

interface RankingHeaderProps {
  activeTier: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
}

export const RankingHeader: React.FC<RankingHeaderProps> = ({
  activeTier,
  onTierChange
}) => {
  const tierOptions: TopNOption[] = [10, 25, 50, 100, "All"];

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold">
        {activeTier === "All" 
          ? "Complete Pokémon Rankings" 
          : `Top ${activeTier} Pokémon Rankings`}
      </h2>
      
      {onTierChange && (
        <div className="flex items-center gap-2 border rounded-md p-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <Select
            value={activeTier.toString()}
            onValueChange={(value) => {
              const newTier = value === "All" ? "All" : Number(value) as TopNOption;
              onTierChange(newTier);
            }}
          >
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {tierOptions.map((tier) => (
                <SelectItem key={tier} value={tier.toString()}>
                  {tier === "All" ? "All Pokémon" : `Top ${tier}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
