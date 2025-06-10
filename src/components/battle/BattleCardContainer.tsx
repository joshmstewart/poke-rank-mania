
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import LoadingOverlay from "./LoadingOverlay";
import BattleCardImage from "./BattleCardImage";
import BattleCardInfo from "./BattleCardInfo";
import BattleCardInteractions from "./BattleCardInteractions";
import { Star } from "lucide-react";
import { useSharedRefinementQueue } from "@/hooks/battle/useSharedRefinementQueue";
import { usePokemonContext } from "@/contexts/PokemonContext";

interface BattleCardContainerProps {
  pokemon: Pokemon;
  isSelected: boolean;
  onSelect: (id: number) => void;
  isProcessing: boolean;
  imageUrl: string;
  displayName: string;
}

const BattleCardContainer: React.FC<BattleCardContainerProps> = ({
  pokemon,
  isSelected,
  onSelect,
  isProcessing,
  imageUrl,
  displayName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const [localPendingState, setLocalPendingState] = useState(() => {
    const stored = localStorage.getItem(`pokemon-pending-${pokemon.id}`);
    return stored === 'true';
  });

  const { refinementQueue, hasRefinementBattles, queueBattlesForReorder } = useSharedRefinementQueue();
  const { allPokemon } = usePokemonContext();

  const contextAvailable = Boolean(
    refinementQueue &&
    Array.isArray(refinementQueue) &&
    typeof hasRefinementBattles === 'boolean'
  );

  const isPendingRefinement = contextAvailable
    ? refinementQueue.some(b => b.primaryPokemonId === pokemon.id) || localPendingState
    : localPendingState;

  const hadRefinementBattlesRef = useRef(false);

  useEffect(() => {
    if (hasRefinementBattles) {
      hadRefinementBattlesRef.current = true;
    }
  }, [hasRefinementBattles]);

  useEffect(() => {
    if (
      contextAvailable &&
      hasRefinementBattles === false &&
      localPendingState &&
      hadRefinementBattlesRef.current
    ) {
      setLocalPendingState(false);
      localStorage.removeItem(`pokemon-pending-${pokemon.id}`);
      hadRefinementBattlesRef.current = false;
    }
  }, [contextAvailable, hasRefinementBattles, localPendingState, pokemon.id]);

  // Hooks for modal content - match manual mode approach
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  useEffect(() => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCardContainer ${displayName}: Component mounted/updated`);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayName]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [INFO_BUTTON_DEBUG] BattleCardContainer ${displayName}: Card clicked`);
    
    // Simple check for info button clicks - match manual mode approach
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button="true"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]') ||
        target.closest('[role="dialog"]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [INFO_BUTTON_DEBUG] BattleCardContainer: Info dialog interaction for ${displayName}, preventing card selection`);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 BattleCardContainer: Ignoring rapid click on ${displayName}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    console.log(`🖱️ BattleCardContainer: Click on ${displayName} (${pokemon.id}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemon.id);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemon.id, displayName, onSelect, isProcessing]);

  const handleMouseEnter = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] BattleCardContainer ${displayName}: Mouse enter - isProcessing: ${isProcessing}`);
    if (!isProcessing) {
      setIsHovered(true);
    }
  }, [isProcessing, displayName]);

  const handleMouseLeave = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] BattleCardContainer ${displayName}: Mouse leave`);
    setIsHovered(false);
  }, [displayName]);

  const handlePrioritizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isPendingRefinement) {
      setLocalPendingState(true);
      localStorage.setItem(`pokemon-pending-${pokemon.id}`, 'true');

      if (contextAvailable && allPokemon.length > 1) {
        const pool = allPokemon.filter(p => p.id !== pokemon.id);
        const opponents: number[] = [];
        const copy = [...pool];
        while (opponents.length < 3 && copy.length > 0) {
          const rand = Math.floor(Math.random() * copy.length);
          opponents.push(copy.splice(rand, 1)[0].id);
        }
        try {
          queueBattlesForReorder(pokemon.id, opponents, -1);
        } catch (error) {
          console.error('Failed to queue refinement battles from battle card', error);
        }
      }
    } else {
      setLocalPendingState(false);
      localStorage.removeItem(`pokemon-pending-${pokemon.id}`);
    }
  };

  // Ensure hover state is only applied when appropriate
  const shouldShowHover = isHovered && !isSelected && !isProcessing;

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform group
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${shouldShowHover ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determine what content to show in modal - match manual mode
  const showLoading = isLoadingTCG;
  const showTCGCards = !isLoadingTCG && hasTcgCard && tcgCard !== null;
  const showFallbackInfo = !isLoadingTCG && !hasTcgCard;

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
      data-hovered={shouldShowHover ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* Prioritize button - battle context */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={handlePrioritizeClick}
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-2 rounded-full transition-opacity duration-200 ${
            isPendingRefinement ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          title="Prioritize for refinement battle"
          type="button"
        >
          <Star
            className={`w-16 h-16 transition-all ${
              isPendingRefinement ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 hover:text-yellow-500'
            }`}
          />
        </button>

        {/* Info Button - exact copy from manual mode */}
        <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button 
                className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Info button clicked for ${pokemon.name}`);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                i
              </button>
            </DialogTrigger>
            
            <DialogContent 
              className="max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={handleDialogClick}
              data-radix-dialog-content="true"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">
                  {pokemon.name}
                </DialogTitle>
              </DialogHeader>

              <PokemonModalContent
                pokemon={pokemon}
                showLoading={showLoading}
                showTCGCards={showTCGCards}
                showFallbackInfo={showFallbackInfo}
                tcgCard={tcgCard}
                secondTcgCard={secondTcgCard}
                flavorText={flavorText}
                isLoadingFlavor={isLoadingFlavor}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Interactive elements */}
        <BattleCardInteractions 
          isHovered={shouldShowHover}
          isSelected={isSelected}
          isProcessing={isProcessing}
        />

        <div className="relative">
          {/* Pokemon Image */}
          <BattleCardImage 
            imageUrl={imageUrl}
            displayName={displayName}
            pokemonId={pokemon.id}
          />

          {/* Pokemon Info */}
          <BattleCardInfo 
            displayName={displayName}
            pokemonId={pokemon.id}
            types={pokemon.types}
          />

          {/* Loading overlay */}
          <LoadingOverlay isVisible={isProcessing} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleCardContainer;
