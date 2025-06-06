import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { getPokemonAvatars } from '@/services/pokemonAvatars';
import { generations } from '@/services/pokemon';

interface AvatarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: string;
  onSelectAvatar: (avatarUrl: string) => void;
}

// Generation details for display
const generationDetails: Record<number, { name: string, games: string }> = {
  1: { name: "Gen 1", games: "Red, Blue, & Yellow" },
  2: { name: "Gen 2", games: "Gold, Silver, & Crystal" },
  3: { name: "Gen 3", games: "Ruby, Sapphire, & Emerald" },
  4: { name: "Gen 4", games: "Diamond, Pearl, & Platinum" },
  5: { name: "Gen 5", games: "Black & White" },
  6: { name: "Gen 6", games: "X & Y" },
  7: { name: "Gen 7", games: "Sun & Moon" },
  8: { name: "Gen 8", games: "Sword & Shield" },
  9: { name: "Gen 9", games: "Scarlet & Violet" }
};

// Pokemon IDs that need scaling up due to smaller sprite sizes
const smallPokemonIds = new Set([
  // Gen 1 starters and babies
  1, 4, 7, 25, 151,
  // Gen 2 starters and babies
  152, 155, 158, 172, 251,
  // Gen 3 starters
  252, 255, 258, 385,
  // Gen 4 starters and small legendaries
  387, 390, 393, 480, 481, 482, 489, 490, 492,
  // Gen 5 starters
  495, 498, 501, 647, 648,
  // Gen 6 starters and small legendaries
  650, 653, 656, 719, 720,
  // Gen 7 starters and small legendaries
  722, 725, 728, 785, 786, 787, 788, 789, 790, 802,
  // Gen 8 starters and small legendaries
  810, 813, 816, 891, 807,
  // Gen 9 starters and small legendaries
  906, 909, 912, 1025
]);

// Special case for Meltan which needs extra scaling
const extraLargePokemonIds = new Set([808]); // Meltan

// Function to get Pokemon ID from avatar URL
const getPokemonIdFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\.png$/);
  return match ? parseInt(match[1], 10) : 0;
};

// Function to get generation for a Pokemon ID
const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(gen => 
    pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

// Function to determine if Pokemon needs scaling
const needsScaling = (pokemonId: number): boolean => {
  return smallPokemonIds.has(pokemonId);
};

// Function to determine if Pokemon needs extra scaling
const needsExtraScaling = (pokemonId: number): boolean => {
  return extraLargePokemonIds.has(pokemonId);
};

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  open,
  onOpenChange,
  currentAvatar,
  onSelectAvatar
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Update selectedAvatar when currentAvatar changes or modal opens
  useEffect(() => {
    if (open) {
      setSelectedAvatar(currentAvatar);
    }
  }, [open, currentAvatar]);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        setLoading(true);
        const urls = await getPokemonAvatars();
        setAvatarUrls(urls);
      } catch (error) {
        console.error('Failed to load avatars:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadAvatars();
    }
  }, [open]);

  // Group avatars by generation and sort by Pokemon ID within each generation
  const avatarsByGeneration = React.useMemo(() => {
    const grouped: Record<number, string[]> = {};
    
    avatarUrls.forEach(url => {
      const pokemonId = getPokemonIdFromUrl(url);
      const generation = getPokemonGeneration(pokemonId);
      
      if (generation) {
        if (!grouped[generation.id]) {
          grouped[generation.id] = [];
        }
        grouped[generation.id].push(url);
      }
    });
    
    // Sort each generation's Pokemon by ID
    Object.keys(grouped).forEach(genId => {
      grouped[parseInt(genId)].sort((a, b) => {
        const idA = getPokemonIdFromUrl(a);
        const idB = getPokemonIdFromUrl(b);
        return idA - idB;
      });
    });
    
    return grouped;
  }, [avatarUrls]);

  const handleSelect = () => {
    onSelectAvatar(selectedAvatar);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <ScrollArea className="h-96 w-full rounded-md border p-4">
            <div className="text-sm text-gray-600 mb-3 text-center">
              Scroll down to see more Pokémon avatars organized by generation
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-sm text-gray-500">Loading avatars...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(avatarsByGeneration)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([genId, urls]) => {
                    const genDetails = generationDetails[parseInt(genId)];
                    if (!genDetails || urls.length === 0) return null;
                    
                    return (
                      <div key={genId} className="space-y-3">
                        {/* Generation Header - More compact */}
                        <div className="bg-gradient-to-r from-blue-50 to-transparent rounded-md p-2 border border-blue-100">
                          <h3 className="font-bold text-gray-800 text-sm">{genDetails.name}: {genDetails.games}</h3>
                        </div>
                        
                        {/* Pokemon Grid for this generation */}
                        <div className="grid grid-cols-6 gap-3">
                          {urls.map((avatarUrl, index) => {
                            const pokemonId = getPokemonIdFromUrl(avatarUrl);
                            const shouldScale = needsScaling(pokemonId);
                            const shouldExtraScale = needsExtraScaling(pokemonId);
                            
                            return (
                              <div
                                key={`${avatarUrl}-${index}`}
                                className="relative flex justify-center items-center"
                              >
                                <div className="relative w-16 h-16 flex justify-center items-center">
                                  <button
                                    onClick={() => setSelectedAvatar(avatarUrl)}
                                    className={`w-16 h-16 aspect-square rounded-full transition-all duration-200 hover:scale-110 ${
                                      selectedAvatar === avatarUrl
                                        ? 'ring-4 ring-blue-500 ring-offset-2'
                                        : 'hover:ring-2 hover:ring-blue-300'
                                    }`}
                                  >
                                    <Avatar className="w-16 h-16">
                                      <AvatarImage 
                                        src={avatarUrl} 
                                        alt={`Pokemon avatar ${pokemonId}`}
                                        className={`object-cover border-2 border-gray-200 ${
                                          shouldExtraScale ? 'scale-[1.91]' : shouldScale ? 'scale-150' : ''
                                        }`}
                                        style={(shouldScale || shouldExtraScale) ? { 
                                          transformOrigin: 'center',
                                          imageRendering: 'pixelated'
                                        } : {}}
                                      />
                                    </Avatar>
                                    {selectedAvatar === avatarUrl && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-4 text-center">
              End of avatar selection
            </div>
          </ScrollArea>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={loading}>
              Select Avatar
            </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
