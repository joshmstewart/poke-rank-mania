
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

  // Sample images for different form types
  const formExamples = {
    mega: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png", // Mega Charizard Y
    regional: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png", // Alolan Muk
    gender: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/593.png", // Female Jellicent
    forms: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10120.png", // Hoopa Unbound
  };

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
        
        <CollapsibleContent className="mt-3 space-y-4">
          {/* Sample images for form types */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                <img src={formExamples.mega} alt="Mega Form" className="h-14 w-14 object-contain" />
              </div>
              <span className="text-xs mt-1">Mega</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                <img src={formExamples.regional} alt="Regional Form" className="h-14 w-14 object-contain" />
              </div>
              <span className="text-xs mt-1">Regional</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                <img src={formExamples.gender} alt="Gender Form" className="h-14 w-14 object-contain" />
              </div>
              <span className="text-xs mt-1">Gender</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                <img src={formExamples.forms} alt="Special Form" className="h-14 w-14 object-contain" />
              </div>
              <span className="text-xs mt-1">Special</span>
            </div>
          </div>
          
          <FormFiltersSelector />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BattleSettings;
