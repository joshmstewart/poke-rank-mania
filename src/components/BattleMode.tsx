
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { generations } from "@/services/pokemonService";

// Import our components
import ProgressTracker from "./battle/ProgressTracker";
import BattleInterface from "./battle/BattleInterface";
import RankingDisplay from "./battle/RankingDisplay";
import SessionManager from "./battle/SessionManager";

// Import our hooks
import { useBattleState } from "@/hooks/useBattleState";
import { useSessionManager, BattleSessionData } from "@/hooks/useSessionManager";

const BattleMode = () => {
  const {
    isLoading,
    selectedGeneration,
    allPokemon,
    battleType,
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    rankingGenerated,
    finalRankings,
    battleHistory,
    showingMilestone,
    completionPercentage,
    fullRankingMode,
    setFullRankingMode,
    milestones,
    handleGenerationChange,
    handleBattleTypeChange,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSaveRankings,
    handleContinueBattles,
    handleNewBattleSet,
    goBack,
    getBattlesRemaining
  } = useBattleState();

  // Handle session import
  const importSessionCallback = (sessionData: BattleSessionData) => {
    // This will be handled by the useBattleState hook automatically
    // Just need to save the data to localStorage
    localStorage.setItem('pokemon-battle-state', JSON.stringify(sessionData));
    window.location.reload(); // Refresh to apply the imported session
  };

  const { exportSessionData, importSessionData } = useSessionManager(importSessionCallback);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading Pokémon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Battle Mode</h1>
            <p className="text-muted-foreground">
              Compare Pokémon head-to-head to create your personal ranking
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <SessionManager onExport={exportSessionData} onImport={importSessionData} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Battle Settings</CardTitle>
            <CardDescription>Configure your battle experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="generation" className="mb-2 block">Generation</Label>
                <Select value={selectedGeneration.toString()} onValueChange={handleGenerationChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Generation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Generations</SelectItem>
                    {generations.filter(gen => gen.id > 0).map((gen) => (
                      <SelectItem key={gen.id} value={gen.id.toString()}>
                        {gen.name} (#{gen.start}-{gen.end})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Battle Type</Label>
                <RadioGroup value={battleType} onValueChange={handleBattleTypeChange} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pairs" id="pairs" />
                    <Label htmlFor="pairs">
                      Pairs (1v1) - Compare two Pokémon at a time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="triplets" id="triplets" />
                    <Label htmlFor="triplets">
                      Triplets (3-way) - Compare three Pokémon at a time (faster)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="mb-2 block">Ranking Mode</Label>
                <RadioGroup 
                  value={fullRankingMode ? "full" : "sample"} 
                  onValueChange={(v) => setFullRankingMode(v === "full")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sample" id="sample" />
                    <Label htmlFor="sample">
                      Sample (~150 Pokémon) - Faster experience
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">
                      Full Ranking - All Pokémon in selected generation
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall completion progress */}
        <ProgressTracker
          completionPercentage={completionPercentage}
          battlesCompleted={battlesCompleted}
          getBattlesRemaining={getBattlesRemaining}
        />

        {!showingMilestone && !rankingGenerated ? (
          <BattleInterface
            currentBattle={currentBattle}
            selectedPokemon={selectedPokemon}
            battlesCompleted={battlesCompleted}
            battleType={battleType}
            battleHistory={battleHistory}
            onPokemonSelect={handlePokemonSelect}
            onTripletSelectionComplete={handleTripletSelectionComplete}
            onGoBack={goBack}
            milestones={milestones}
          />
        ) : (
          <RankingDisplay
            finalRankings={finalRankings}
            battlesCompleted={battlesCompleted}
            rankingGenerated={rankingGenerated}
            onNewBattleSet={handleNewBattleSet}
            onContinueBattles={handleContinueBattles}
            onSaveRankings={handleSaveRankings}
          />
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-gray-600">
              You've completed {battlesCompleted} battles. The more battles you complete, the more accurate your ranking will be!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleMode;
