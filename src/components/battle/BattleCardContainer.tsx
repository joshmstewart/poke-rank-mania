
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import LoadingOverlay from "./LoadingOverlay";
import BattleCardImage from "./BattleCardImage";
import BattleCardInfo from "./BattleCardInfo";
import BattleCardInteractions from "./BattleCardInteractions";

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
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCardContainer ${displayName}: Component mounted/updated`);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayName]);

  // Reset hover state when modal opens or closes
  useEffect(() => {
    console.log(`🔘 [HOVER_DEBUG] BattleCardContainer ${displayName}: Modal state changed to ${modalOpen}`);
    if (modalOpen) {
      setIsHovered(false);
    }
  }, [modalOpen, displayName]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [INFO_BUTTON_DEBUG] BattleCardContainer ${displayName}: Card clicked`);
    
    // Enhanced check for info button clicks
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button]') || 
        target.closest('[role="dialog"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [INFO_BUTTON_DEBUG] BattleCardContainer: Info dialog interaction for ${displayName}, preventing card selection`);
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
    console.log(`🔘 [HOVER_DEBUG] BattleCardContainer ${displayName}: Mouse enter - modalOpen: ${modalOpen}, isProcessing: ${isProcessing}`);
    if (!isProcessing && !modalOpen) {
      setIsHovered(true);
    }
  }, [isProcessing, modalOpen, displayName]);

  const handleMouseLeave = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] BattleCardContainer ${displayName}: Mouse leave`);
    setIsHovered(false);
  }, [displayName]);

  const handleInfoButtonInteraction = useCallback((e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCardContainer ${displayName}: Info button interaction`);
    e.preventDefault();
    e.stopPropagation();
    
    // Force reset hover state when info button is interacted with
    setIsHovered(false);
  }, [displayName]);

  const handleModalStateChange = useCallback((open: boolean) => {
    console.log(`🔘 [MODAL_DEBUG] BattleCardContainer ${displayName}: Modal state changing to ${open}`);
    setModalOpen(open);
    if (open) {
      setIsHovered(false);
    }
  }, [displayName]);

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${isHovered && !isSelected && !modalOpen ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
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
        <BattleCardInteractions 
          isHovered={isHovered}
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
