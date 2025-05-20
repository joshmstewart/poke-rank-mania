
import React, { useState } from "react";
import { useGenerationSettings } from "@/hooks/battle/useGenerationSettings";
import { Separator } from "@/components/ui/separator";
import { FormFiltersSelector } from "@/components/settings/FormFiltersSelector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BattleSettingsProps {
  onGenerationChange: (genId: number) => void;
  onBattleTypeChange: (type: "pairs" | "triplets") => void;
  selectedGeneration: number;
  battleType: "pairs" | "triplets";
}

const BattleSettings: React.FC<BattleSettingsProps> = ({ 
  selectedGeneration
}) => {
  const { generationName } = useGenerationSettings(selectedGeneration);
  const [isFormFilterOpen, setIsFormFilterOpen] = useState(true); // Open by default in dialog

  return (
    <div className="space-y-4">
      {/* Form filters section with collapsible content */}
      <Collapsible 
        open={isFormFilterOpen} 
        onOpenChange={setIsFormFilterOpen}
        className="border rounded-md p-3 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Pokémon Form Filters</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              {isFormFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">
          Control which Pokémon forms appear in battles
        </p>
        
        <CollapsibleContent className="mt-3">
          <FormFiltersSelector />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BattleSettings;
