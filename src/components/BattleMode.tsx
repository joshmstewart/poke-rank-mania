
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
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
  
  useEffect(() => {
    loadPokemon();
  }, [selectedGeneration]);

  const loadPokemon = async () => {
    setIsLoading(true);
    const pokemon = await fetchAllPokemon(selectedGeneration);
    setAllPokemon(pokemon);
    
    // Reset battle state
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setSelectedPokemon([]);
    
    // Start the first battle
    if (pokemon.length > 0) {
      startNewBattle(pokemon);
    }
    
    setIsLoading(false);
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
    startNewBattle(allPokemon);
  };

  const handlePokemonSelect = (id: number) => {
    if (selectedPokemon.includes(id)) {
      // If already selected, unselect it
      setSelectedPokemon(selectedPokemon.filter(pokemonId => pokemonId !== id));
    } else {
      // If in pairs mode, only allow one selection
      if (battleType === "pairs") {
        setSelectedPokemon([id]);
      } else {
        // In triplets mode, allow multiple selections
        setSelectedPokemon([...selectedPokemon, id]);
      }
    }
  };

  const handleBattleSubmit = () => {
    if ((battleType === "pairs" && selectedPokemon.length !== 1) ||
        (battleType === "triplets" && selectedPokemon.length === 0)) {
      toast({
        title: "Selection Required",
        description: battleType === "pairs" 
          ? "Please select your favorite Pokémon to continue." 
          : "Please select at least one Pokémon to continue.",
        variant: "destructive"
      });
      return;
    }

    // Process battle results
    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => p.id === selectedPokemon[0])!;
      const loser = currentBattle.find(p => p.id !== selectedPokemon[0])!;
      newResults.push({ winner, loser });
    } else {
      // For triplets, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selectedPokemon.includes(p.id));
      const losers = currentBattle.filter(p => !selectedPokemon.includes(p.id));
      
      winners.forEach(winner => {
        losers.forEach(loser => {
          newResults.push({ winner, loser });
        });
      });
    }
    
    setBattleResults(newResults);
    setBattlesCompleted(battlesCompleted + 1);
    
    // Decide whether to generate rankings or start a new battle
    if (battlesCompleted >= 9) { // After 10 battles (0-indexed)
      generateRankings(newResults);
    } else {
      startNewBattle(allPokemon);
    }
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
    setRankingGenerated(true);
    
    toast({
      title: "Ranking Complete!",
      description: "Your Pokémon ranking has been generated based on your battle choices."
    });
  };

  const handleSaveRankings = () => {
    saveRankings(finalRankings, selectedGeneration);
  };

  const handleNewBattleSet = () => {
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    startNewBattle(allPokemon);
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

        {!rankingGenerated ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Battle {battlesCompleted + 1}/10</h2>
                <div className="text-sm text-gray-500">
                  Select your {battleType === "pairs" ? "favorite" : "favorites"}
                </div>
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-1 bg-primary rounded-full transition-all" 
                  style={{ width: `${(battlesCompleted) * 10}%` }}
                ></div>
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
            
            <div className="mt-8 flex justify-center">
              <Button 
                size="lg" 
                onClick={handleBattleSubmit}
                className="px-8"
              >
                Submit Your Choice
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Your Generated Ranking</h2>
            <p className="mb-8 text-gray-600">
              Based on your {battlesCompleted} battle choices, we've generated a ranking of your favorite Pokémon.
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
              <Button variant="outline" onClick={handleNewBattleSet}>
                Start New Battle Set
              </Button>
              <Button onClick={handleSaveRankings}>
                Save This Ranking
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleMode;
