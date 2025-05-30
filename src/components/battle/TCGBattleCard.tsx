
import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import LoadingOverlay from "./LoadingOverlay";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import EnhancedTCGFallback from "./EnhancedTCGFallback";
import TCGCardImage from "./TCGCardImage";
import TCGCardInfo from "./TCGCardInfo";
import TCGCardInteractions from "./TCGCardInteractions";
import TCGCardLoading from "./TCGCardLoading";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";

interface TCGBattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: BattleType;
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const TCGBattleCard: React.FC<TCGBattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Always try to load TCG card data
  const { tcgCard, isLoading: isLoadingTCG, hasTcgCard } = usePokemonTCGCard(pokemon.name, true);
  
  const displayName = pokemon.name;
  
  console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: TCG loading=${isLoadingTCG}, hasTcgCard=${hasTcgCard}, isProcessing=${isProcessing}`);

  useEffect(() => {
    console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: Component mounted/updated`);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayName]);

  // Reset hover state when modal opens or closes
  useEffect(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Modal state changed to ${modalOpen}`);
    // Always reset hover state when modal state changes
    setIsHovered(false);
  }, [modalOpen, displayName]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [TCG_BATTLE_CARD] ${displayName}: Card clicked`);
    
    // Enhanced check for info button clicks
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button]') || 
        target.closest('[role="dialog"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [TCG_BATTLE_CARD] Info dialog interaction for ${displayName}, preventing card selection`);
      return;
    }

    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 [TCG_BATTLE_CARD] Ignoring rapid click on ${displayName}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    console.log(`🖱️ [TCG_BATTLE_CARD] Click on ${displayName} (${pokemon.id}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemon.id);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemon.id, displayName, onSelect, isProcessing]);

  const handleMouseEnter = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse enter - modalOpen: ${modalOpen}, isProcessing: ${isProcessing}`);
    // Only allow hover state if modal is closed and not processing
    if (!isProcessing && !modalOpen) {
      setIsHovered(true);
    }
  }, [isProcessing, modalOpen, displayName]);

  const handleMouseLeave = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse leave`);
    setIsHovered(false);
  }, [displayName]);

  const handleInfoButtonInteraction = useCallback((e: React.MouseEvent) => {
    console.log(`🔘 [TCG_BATTLE_CARD] ${displayName}: Info button interaction`);
    e.preventDefault();
    e.stopPropagation();
    
    // Immediately clear hover state when info button is clicked
    setIsHovered(false);
  }, [displayName]);

  const handleModalStateChange = useCallback((open: boolean) => {
    console.log(`🔘 [MODAL_DEBUG] TCGBattleCard ${displayName}: Modal state changing to ${open}`);
    setModalOpen(open);
    // Force clear hover state regardless of modal state
    setIsHovered(false);
  }, [displayName]);

  // Ensure hover state is only applied when appropriate
  const shouldShowHover = isHovered && !isSelected && !modalOpen && !isProcessing;

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${shouldShowHover ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

  // Determine what to show
  const showLoading = isLoadingTCG;
  const showTCGCard = !isLoadingTCG && hasTcgCard && tcgCard;
  const showFallback = !isLoadingTCG && !hasTcgCard;

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
      data-modal-open={modalOpen ? "true" : "false"}
      data-hovered={shouldShowHover ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* Info Button */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal 
            pokemon={pokemon}
            onOpenChange={handleModalStateChange}
          >
            <button 
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
              onClick={handleInfoButtonInteraction}
              onMouseEnter={() => setIsHovered(false)}
              data-info-button="true"
            >
              i
            </button>
          </PokemonInfoModal>
        </div>

        {/* Interactive elements */}
        <TCGCardInteractions 
          isHovered={shouldShowHover}
          isSelected={isSelected}
          isProcessing={isProcessing}
        />

        <div className="relative">
          {/* Loading State */}
          {showLoading && <TCGCardLoading />}

          {/* TCG Card Display */}
          {showTCGCard && (
            <div className="space-y-3">
              <TCGCardImage tcgCard={tcgCard} displayName={displayName} />
              <TCGCardInfo pokemon={pokemon} displayName={displayName} />
            </div>
          )}

          {/* Enhanced Fallback */}
          {showFallback && (
            <EnhancedTCGFallback pokemon={pokemon} />
          )}

          {/* Loading overlay that keeps content visible */}
          <LoadingOverlay isVisible={isProcessing} />
        </div>
      </CardContent>
    </Card>
  );
});

TCGBattleCard.displayName = "TCGBattleCard";

export default TCGBattleCard;
