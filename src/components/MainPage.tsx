
import React, { useState } from "react";
import PokemonRanker from "./PokemonRanker";
import BattleContentCore from "./battle/BattleContentCore";
import ModeSwitcher from "./ModeSwitcher";
import ImpliedBattleValidator from "./battle/ImpliedBattleValidator";
import { usePokemonContext } from "@/contexts/PokemonContext";

type Mode = "rank" | "battle";

const MainPage = () => {
  const [currentMode, setCurrentMode] = useState<Mode>("battle");
  const [validatorVisible, setValidatorVisible] = useState(true);
  const { allPokemon } = usePokemonContext();

  const handleModeChange = (mode: Mode) => {
    console.log(`[MainPage] Mode changed to: ${mode}`);
    setCurrentMode(mode);
  };

  const toggleValidatorVisibility = () => {
    setValidatorVisible(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col">
        {/* Header with Mode Switcher */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="container max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Pokémon Ranker
              </h1>
              <div className="text-sm text-gray-500">
                {currentMode === "battle" ? "Battle Mode" : "Manual Mode"}
              </div>
            </div>
            <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {currentMode === "rank" ? (
            <PokemonRanker />
          ) : (
            <BattleContentCore 
              allPokemon={allPokemon}
              initialBattleType="pairs"
              initialSelectedGeneration={0}
            />
          )}
        </div>

        {/* Implied Battle Validator - only show in battle mode */}
        {currentMode === "battle" && (
          <ImpliedBattleValidator 
            isVisible={validatorVisible}
            onToggleVisibility={toggleValidatorVisibility}
          />
        )}
      </div>
    </div>
  );
};

export default MainPage;
