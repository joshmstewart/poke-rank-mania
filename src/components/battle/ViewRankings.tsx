
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Trophy, Medal, List, ChevronDown, ChevronUp } from "lucide-react";
import { Pokemon, getSavedRankings } from "@/services/pokemon";

interface ViewRankingsProps {
  selectedGeneration: number;
  onClose: () => void;
}

const ViewRankings: React.FC<ViewRankingsProps> = ({
  selectedGeneration,
  onClose
}) => {
  const [rankings, setRankings] = useState<Pokemon[]>([]);
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const displayCount = showAllRankings ? rankings.length : 10;

  useEffect(() => {
    const loadRankings = async () => {
      setIsLoading(true);
      const savedRankings = await getSavedRankings(selectedGeneration);
      setRankings(savedRankings || []);
      setIsLoading(false);
    };
    
    loadRankings();
  }, [selectedGeneration]);
  
  const renderRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-2xl font-bold">{rank}</span>;
  };
  
  return (
    <Card className="bg-white shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <List className="mr-2 text-primary" />
            <h2 className="text-2xl font-bold">Your Saved Rankings</h2>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <p className="text-gray-600">
          View your previously saved Pokémon rankings
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : rankings.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rankings.slice(0, displayCount).map((pokemon, index) => (
                <Card key={pokemon.id} className={`flex items-center p-4 ${index < 3 ? 'border-2 ' + (index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-300' : 'border-amber-600') : ''}`}>
                  <div className="flex-shrink-0 mr-4 flex items-center justify-center w-10">
                    {renderRankBadge(index + 1)}
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
            
            {rankings.length > 10 && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllRankings(!showAllRankings)}
                  className="flex items-center gap-1"
                >
                  {showAllRankings ? (
                    <>Show Less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show All {rankings.length} Rankings <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>You don't have any saved rankings for this generation yet.</p>
            <Button onClick={onClose} className="mt-4">Back to Battles</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ViewRankings;
