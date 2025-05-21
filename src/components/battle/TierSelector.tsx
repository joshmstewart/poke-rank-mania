
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNOption } from "@/services/pokemon";
import { Trophy } from "lucide-react";

interface TierSelectorProps {
  activeTier: TopNOption;
  onTierChange: (tier: TopNOption) => void;
}

const TierSelector: React.FC<TierSelectorProps> = ({ activeTier, onTierChange }) => {
  const tierOptions: TopNOption[] = [10, 25, 50, 100, "All"];
  
  return (
    <div className="flex items-center gap-2 border rounded-md p-2 bg-white">
      <Trophy className="h-4 w-4 text-amber-500" />
      <span className="text-sm font-medium">Ranking:</span>
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
  );
};

export default TierSelector;
