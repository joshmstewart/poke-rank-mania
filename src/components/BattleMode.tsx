import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
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
import { 
  Pokemon, 
  fetchAllPokemon, 
  saveRankings, 
  loadRankings, 
  generations
} from "@/services/pokemonService";

// Import our components
import ProgressTracker from "./battle/ProgressTracker";
import BattleInterface from "./battle/BattleInterface";
import RankingDisplay from "./battle/RankingDisplay";
import SessionManager from "./battle/SessionManager";

type BattleType = "pairs" | "triplets";
type BattleResult = { winner: Pokemon, loser: Pokemon }[];

const BattleMode = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState(0); // Default to All Generations
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<BattleResult>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [fullRankingMode, setFullRankingMode] = useState(false);
  
  // Milestone triggers - show rankings at these battle counts
  const milestones = [10, 25, 50, 100, 200, 500, 1000];
  
  // Load saved battle state on initial load
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      setSelectedGeneration(savedState.selectedGeneration);
      setBattleType(savedState.battleType);
      setBattleResults(savedState.battleResults || []);
      setBattlesCompleted(savedState.battlesCompleted || 0);
      setBattleHistory(savedState.battleHistory || []);
      setCompletionPercentage(savedState.completionPercentage || 0);
      setFullRankingMode(savedState.fullRankingMode || false);
      
      // We'll load the Pokemon separately based on the saved generation
      loadPokemon(savedState.selectedGeneration, true);
    } else {
      loadPokemon();
    }
  }, []);

  useEffect(() => {
    // Only reload Pokemon if generation changes
    if (!isLoading) {
      loadPokemon();
    }
  }, [selectedGeneration, fullRankingMode]);

  useEffect(() => {
    // Calculate completion percentage when battle results change
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
      
      // Save battle state whenever results change
      saveBattleState();
    }
  }, [battleResults, allPokemon, selectedGeneration, battleType]);

  // Save current battle state to local storage
  const saveBattleState = () => {
    try {
      const state = {
        selectedGeneration,
        battleType,
        battleResults,
        battlesCompleted,
        battleHistory,
        completionPercentage,
        fullRankingMode
      };
      localStorage.setItem('pokemon-battle-state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving battle state:', error);
    }
  };

  // Load battle state from local storage
  const loadBattleState = () => {
    try {
      const savedState = localStorage.getItem('pokemon-battle-state');
      if (savedState) {
        return JSON.parse(savedState);
      }
      return null;
    } catch (error) {
      console.error('Error loading battle state:', error);
      return null;
    }
  };

  const loadPokemon = async (genId = selectedGeneration, preserveState = false) => {
    setIsLoading(true);
    const pokemon = await fetchAllPokemon(genId, fullRankingMode);
    setAllPokemon(pokemon);
    
    if (!preserveState) {
      // Reset battle state if not preserving state
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setSelectedPokemon([]);
      setBattleHistory([]);
      setShowingMilestone(false);
      setCompletionPercentage(0);
    }
    
    // Start the first battle or continue from previous battle
    if (pokemon.length > 0) {
      if (preserveState && battleHistory.length > 0) {
        // If we're preserving state, restore the last battle
        const lastBattle = battleHistory[battleHistory.length - 1];
        setCurrentBattle(lastBattle.battle);
        setSelectedPokemon([]);
      } else {
        // Otherwise start a new battle
        startNewBattle(pokemon);
      }
    }
    
    setIsLoading(false);
  };

  // Calculate how complete the ranking process is
  const calculateCompletionPercentage = () => {
    // For a complete ranking in a tournament style, we need at least n-1 comparisons
    // where n is the number of Pokémon
    const totalPokemon = allPokemon.length;
    
    if (totalPokemon <= 1) {
      setCompletionPercentage(100);
      return;
    }
    
    // Minimum number of comparisons needed for a complete ranking
    const minimumComparisons = totalPokemon - 1;
    
    // For pairs, each battle gives us 1 comparison
    // For triplets, each battle can give us multiple comparisons depending on selections
    const currentComparisons = battleResults.length;
    
    // Calculate percentage (cap at 100%)
    const percentage = Math.min(100, Math.floor((currentComparisons / minimumComparisons) * 100));
    setCompletionPercentage(percentage);
    
    // If we've reached 100%, make sure to show the final rankings
    if (percentage >= 100 && !rankingGenerated) {
      generateRankings(battleResults);
      setRankingGenerated(true);
    }
  };

  const startNewBattle = (pokemonList: Pokemon[]) => {
    if (pokemonList.length < 2) {
      // Not enough Pokémon for a battle
      return;
    }
    
    // Shuffle the list to get random Pokémon
    const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
    
    // Get the first 2 or 3 Pokémon based on battle type
    const battleSize = battleType === "pairs" ? 2 : 3;
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  };

  const handleGenerationChange = (value: string) => {
    setSelectedGeneration(Number(value));
  };

  const handleBattleTypeChange = (value: string) => {
    setBattleType(value as BattleType);
    // Reset battles and start new one with current Pokémon pool
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Important: Start a new battle with the correct number of Pokémon for the selected battle type
    if (allPokemon.length > 0) {
      // Create a new battle with the correct number of Pokémon
      const battleSize = value === "pairs" ? 2 : 3;
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      setCurrentBattle(shuffled.slice(0, battleSize));
      setSelectedPokemon([]);
    }
  };

  const handlePokemonSelect = (id: number) => {
    // For pairs, immediately process the battle when selection is made
    if (battleType === "pairs") {
      // Save current battle to history before processing
      setBattleHistory([...battleHistory, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      processBattleResult([id]);
    } else {
      // For triplets, toggle selection
      if (selectedPokemon.includes(id)) {
        // If already selected, unselect it
        setSelectedPokemon(selectedPokemon.filter(pokemonId => pokemonId !== id));
      } else {
        // Add to selection
        setSelectedPokemon([...selectedPokemon, id]);
      }
    }
  };

  const handleTripletSelectionComplete = () => {
    // Save current battle to history
    setBattleHistory([...battleHistory, { 
      battle: [...currentBattle], 
      selected: [...selectedPokemon] 
    }]);
    
    processBattleResult(selectedPokemon);
  };

  const processBattleResult = (selections: number[]) => {
    if ((battleType === "triplets" && selections.length === 0)) {
      toast({
        title: "Selection Required",
        description: "Please select at least one Pokémon to continue.",
        variant: "destructive"
      });
      return;
    }

    // Process battle results
    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => p.id === selections[0])!;
      const loser = currentBattle.find(p => p.id !== selections[0])!;
      newResults.push({ winner, loser });
    } else {
      // For triplets, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selections.includes(p.id));
      const losers = currentBattle.filter(p => !selections.includes(p.id));
      
      winners.forEach(winner => {
        losers.forEach(loser => {
          newResults.push({ winner, loser });
        });
      });
    }
    
    setBattleResults(newResults);
    const newBattlesCompleted = battlesCompleted + 1;
    setBattlesCompleted(newBattlesCompleted);
    
    // Check if we've hit a milestone
    if (milestones.includes(newBattlesCompleted)) {
      generateRankings(newResults);
      setShowingMilestone(true);
    } else {
      // Continue with next battle
      startNewBattle(allPokemon);
    }
  };

  const goBack = () => {
    if (battleHistory.length === 0) {
      toast({
        title: "No previous battles",
        description: "There are no previous battles to return to."
      });
      return;
    }
    
    // Remove the last battle result
    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);
    
    // Also remove the last result from battleResults
    const newResults = [...battleResults];
    
    // Calculate how many results to remove based on the battle type and selections
    let resultsToRemove = 1; // Default for pairs
    if (battleType === "triplets" && lastBattle) {
      const selectedCount = lastBattle.selected.length;
      const unselectedCount = lastBattle.battle.length - selectedCount;
      resultsToRemove = selectedCount * unselectedCount;
    }
    
    // Remove the appropriate number of results
    newResults.splice(newResults.length - resultsToRemove, resultsToRemove);
    setBattleResults(newResults);
    
    // Decrement battles completed
    setBattlesCompleted(battlesCompleted - 1);
    
    // Set the current battle back to the previous one
    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }
    
    // If we were showing a milestone, go back to battles
    setShowingMilestone(false);
  };

  const generateRankings = (results: BattleResult) => {
    // Use a simple ELO-like algorithm to rank Pokémon
    const scores = new Map<number, { pokemon: Pokemon, score: number }>();
    
    // Initialize all Pokémon with a base score
    allPokemon.forEach(pokemon => {
      scores.set(pokemon.id, { pokemon, score: 1000 });
    });
    
    // Update scores based on battle results
    results.forEach(result => {
      const winnerId = result.winner.id;
      const loserId = result.loser.id;
      
      const winnerData = scores.get(winnerId)!;
      const loserData = scores.get(loserId)!;
      
      // Simple score adjustment
      winnerData.score += 10;
      loserData.score -= 5;
      
      scores.set(winnerId, winnerData);
      scores.set(loserId, loserData);
    });
    
    // Convert to array and sort by score
    const rankings = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => item.pokemon);
    
    setFinalRankings(rankings);
    
    // Only set rankingGenerated to true if we're at the final milestone or completion percentage is 100%
    if (battlesCompleted >= milestones[milestones.length - 1] || completionPercentage >= 100) {
      setRankingGenerated(true);
    }
    
    toast({
      title: "Milestone Reached!",
      description: `You've completed ${battlesCompleted} battles. Here's your current ranking!`
    });
  };

  const handleSaveRankings = () => {
    saveRankings(finalRankings, selectedGeneration);
  };

  const handleContinueBattles = () => {
    setShowingMilestone(false);
    startNewBattle(allPokemon);
  };

  const handleNewBattleSet = () => {
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    startNewBattle(allPokemon);
  };

  // Export battle state data for session sharing
  const exportSessionData = (): string => {
    const sessionData = {
      selectedGeneration,
      battleType,
      battleResults,
      battlesCompleted,
      battleHistory,
      completionPercentage,
      fullRankingMode
    };
    return JSON.stringify(sessionData);
  };

  // Import battle state data from session sharing
  const importSessionData = (sessionDataStr: string) => {
    try {
      const sessionData = JSON.parse(sessionDataStr);
      setSelectedGeneration(sessionData.selectedGeneration || 0);
      setBattleType(sessionData.battleType || "pairs");
      setBattleResults(sessionData.battleResults || []);
      setBattlesCompleted(sessionData.battlesCompleted || 0);
      setBattleHistory(sessionData.battleHistory || []);
      setCompletionPercentage(sessionData.completionPercentage || 0);
      setFullRankingMode(sessionData.fullRankingMode || false);
      
      // Load the Pokemon data and restore state
      loadPokemon(sessionData.selectedGeneration, true);
    } catch (error) {
      toast({
        title: "Import Error",
        description: "The session data could not be imported.",
        variant: "destructive"
      });
    }
  };

  // Calculate how many more battles are needed for a complete ranking
  const getBattlesRemaining = () => {
    if (completionPercentage >= 100) return 0;
    
    const totalPokemon = allPokemon.length;
    const minimumComparisons = totalPokemon - 1;
    const currentComparisons = battleResults.length;
    
    // Estimate remaining battles based on battle type
    if (battleType === "pairs") {
      return minimumComparisons - currentComparisons;
    } else {
      // For triplets, each battle can generate multiple comparisons
      // Use a conservative estimate: each triplet battle gives ~2 comparisons on average
      return Math.ceil((minimumComparisons - currentComparisons) / 2);
    }
  };

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
