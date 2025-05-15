import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  Pokemon, 
  fetchAllPokemon, 
  saveRankings, 
  loadRankings, 
  generations
} from "@/services/pokemonService";

type BattleType = "pairs" | "triplets";
type BattleResult = { winner: Pokemon, loser: Pokemon }[];

const BattleMode = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState(1);
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
  
  // Milestone triggers - show rankings at these battle counts
  const milestones = [10, 25, 50, 100, 200, 500, 1000];
  
  useEffect(() => {
    loadPokemon();
  }, [selectedGeneration]);

  useEffect(() => {
    // Calculate completion percentage when battle results change
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
    }
  }, [battleResults, allPokemon]);

  const loadPokemon = async () => {
    setIsLoading(true);
    const pokemon = await fetchAllPokemon(selectedGeneration);
    setAllPokemon(pokemon);
    
    // Reset battle state
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setSelectedPokemon([]);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    
    // Start the first battle
    if (pokemon.length > 0) {
      startNewBattle(pokemon);
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
    startNewBattle(allPokemon);
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Battle Mode</h1>
          <div className="flex items-center gap-2">
            <Select value={selectedGeneration.toString()} onValueChange={handleGenerationChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {generations.filter(gen => gen.id > 0).map((gen) => (
                  <SelectItem key={gen.id} value={gen.id.toString()}>
                    {gen.name} (#{gen.start}-{gen.end})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={battleType} onValueChange={handleBattleTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Battle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pairs">Pairs (1v1)</SelectItem>
                <SelectItem value="triplets">Triplets (3-way)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall completion progress */}
        <Card className="bg-white rounded-lg shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Overall Ranking Progress</h3>
              <span className="text-sm text-gray-500">
                {completionPercentage}% Complete
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Battles completed: {battlesCompleted}</span>
              <span>
                {completionPercentage < 100 
                  ? `~${getBattlesRemaining()} more battles needed` 
                  : <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-1" /> Complete ranking achieved!</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {!showingMilestone && !rankingGenerated ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4 relative">
              {battleHistory.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute -left-2 top-0" 
                  onClick={goBack}
                >
                  <ChevronLeft className="mr-1" /> Back
                </Button>
              )}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Battle {battlesCompleted + 1}</h2>
                <div className="text-sm text-gray-500">
                  Select your {battleType === "pairs" ? "favorite" : "favorites"}
                </div>
              </div>
              
              {/* Progress bar that shows progress to the next milestone */}
              <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-1 bg-primary rounded-full transition-all" 
                  style={{ 
                    width: `${(battlesCompleted % (milestones.find(m => m > battlesCompleted) || 10)) / 
                    (milestones.find(m => m > battlesCompleted) || 10) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1 text-gray-500">
                Next milestone: {milestones.find(m => m > battlesCompleted) || "∞"} battles
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {currentBattle.map(pokemon => (
                <div 
                  key={pokemon.id} 
                  className={`cursor-pointer ${selectedPokemon.includes(pokemon.id) ? "ring-4 ring-primary" : ""}`}
                  onClick={() => handlePokemonSelect(pokemon.id)}
                >
                  <Card className="h-full transform transition-all hover:scale-105">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <img 
                        src={pokemon.image} 
                        alt={pokemon.name} 
                        className="w-32 h-32 object-contain mb-4" 
                      />
                      <h3 className="text-xl font-bold">{pokemon.name}</h3>
                      <p className="text-gray-500">#{pokemon.id}</p>
                      
                      {pokemon.types && pokemon.types.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {pokemon.types.map((type, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 text-xs rounded-full bg-gray-100"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {battleType === "pairs" ? (
                        <RadioGroup 
                          value={selectedPokemon.includes(pokemon.id) ? pokemon.id.toString() : ""} 
                          className="mt-4"
                          onValueChange={(val) => handlePokemonSelect(Number(val))}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={pokemon.id.toString()} id={`radio-${pokemon.id}`} />
                            <label htmlFor={`radio-${pokemon.id}`}>Select</label>
                          </div>
                        </RadioGroup>
                      ) : (
                        <Button
                          variant={selectedPokemon.includes(pokemon.id) ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePokemonSelect(pokemon.id);
                          }}
                          className="mt-4"
                        >
                          {selectedPokemon.includes(pokemon.id) ? "Selected" : "Select"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Only show the submit button for triplets */}
            {battleType === "triplets" && (
              <div className="mt-8 flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleTripletSelectionComplete}
                  className="px-8"
                >
                  Submit Your Choices
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              {rankingGenerated ? "Your Final Ranking" : "Milestone Reached!"}
            </h2>
            <p className="mb-8 text-gray-600">
              Based on your {battlesCompleted} battle choices, here's your{rankingGenerated ? " final" : " current"} ranking of Pokémon.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {finalRankings.slice(0, 10).map((pokemon, index) => (
                <Card key={pokemon.id} className="flex items-center p-4">
                  <div className="flex-shrink-0 mr-4">
                    <span className="text-2xl font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-shrink-0 w-16 h-16">
                    <img 
                      src={pokemon.image} 
                      alt={pokemon.name} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold">{pokemon.name}</h3>
                    <p className="text-sm text-gray-500">#{pokemon.id}</p>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center gap-4 mt-8">
              {rankingGenerated ? (
                <>
                  <Button variant="outline" onClick={handleNewBattleSet}>
                    Start New Battle Set
                  </Button>
                  <Button onClick={handleSaveRankings}>
                    Save This Ranking
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleNewBattleSet}>
                    Restart Battles
                  </Button>
                  <Button onClick={handleContinueBattles}>
                    Continue Battling
                  </Button>
                  <Button variant="secondary" onClick={handleSaveRankings}>
                    Save Current Ranking
                  </Button>
                </>
              )}
            </div>
          </div>
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
