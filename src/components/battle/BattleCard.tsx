import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { getPreferredImage, ImageType } from "@/utils/imageUtils";
import { getCurrentImageMode } from "@/components/settings/imagePreferenceHelpers";
import PokemonImage from "./PokemonImage";
import PokemonInfo from "./PokemonInfo";
import LoadingOverlay from "./LoadingOverlay";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import TCGBattleCard from "./TCGBattleCard";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: BattleType;
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const BattleCard: React.FC<BattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  const currentImageMode = getCurrentImageMode();
  
  console.log(`🎯 [BATTLE_CARD] Pokemon ${pokemon.id}: Image mode is ${currentImageMode}`);
  
  // If TCG mode is selected, use the TCG Battle Card component
  if (currentImageMode === 'tcg') {
    return (
      <TCGBattleCard
        pokemon={pokemon}
        isSelected={isSelected}
        battleType={battleType}
        onSelect={onSelect}
        isProcessing={isProcessing}
      />
    );
  }

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const [infoButtonVisible, setInfoButtonVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // CRITICAL FIX: Use the Pokemon name directly (it should already be formatted by validateBattlePokemon)
  const displayName = pokemon.name;
  
  console.log(`🎯 [BATTLE_CARD_CRITICAL] Pokemon ${pokemon.id}: using name "${displayName}"`);
  console.log(`🎯 [LOADING_CIRCLES] BattleCard ${displayName} received isProcessing: ${isProcessing}`);
  console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCard ${displayName}: Info button should be visible: ${infoButtonVisible}`);
  
  // CRITICAL FIX: Don't hide Pokemon during processing - show loading overlay instead
  if (isProcessing) {
    console.log(`🟡 [LOADING_CIRCLES] BattleCard ${displayName} SHOWING loading state`);
  } else {
    console.log(`🟢 [LOADING_CIRCLES] BattleCard ${displayName} NOT showing loading state`);
  }

  useEffect(() => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCard ${displayName}: Component mounted/updated`);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayName]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [INFO_BUTTON_DEBUG] BattleCard ${displayName}: Card clicked`);
    
    // Enhanced check for info button clicks - check for dialog elements too
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button]') || 
        target.closest('[role="dialog"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [INFO_BUTTON_DEBUG] BattleCard: Info dialog interaction for ${displayName}, preventing card selection`);
      return;
    }

    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 BattleCard: Ignoring rapid click on ${displayName}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    // CRITICAL FIX: Don't block clicks during processing - let parent handle
    console.log(`🖱️ BattleCard: Click on ${displayName} (${pokemon.id}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemon.id);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemon.id, displayName, onSelect, isProcessing]);

  const handleInfoButtonClick = useCallback((e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCard ${displayName}: Info button clicked directly`);
    e.preventDefault();
    e.stopPropagation();
  }, [displayName]);

  const preferredImageType: ImageType = 
    (localStorage.getItem('preferredImageType') as ImageType) || 'official';
  
  console.log(`🖼️ [DEV] Getting preferred image type: ${preferredImageType}`);
  
  const imageUrl = getPreferredImage(pokemon, preferredImageType);
  
  console.log(`🏆 BattleCard: Rendering Pokemon ${displayName} (#${pokemon.id}) with isSelected=${isSelected}`);
  console.log(`🖼️ BattleCard: Loading "${preferredImageType}" image for ${displayName} (#${pokemon.id}): ${imageUrl}`);

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${isHovered && !isSelected ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* Info Button - Enhanced visibility */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
              onClick={(e) => {
                console.log(`🔘 [INFO_BUTTON_DEBUG] BattleCard ${displayName}: Inner button clicked`);
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              i
            </button>
          </PokemonInfoModal>
        </div>

        {/* Selection feedback overlay */}
        {isHovered && !isSelected && !isProcessing && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center z-10">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Choose this Pokémon
            </div>
          </div>
        )}

        {isSelected && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
            Winner!
          </div>
        )}

        {/* CRITICAL FIX: Keep Pokemon visible, add loading overlay instead */}
        <div className="relative">
          {/* Pokemon Image */}
          <PokemonImage 
            imageUrl={imageUrl}
            displayName={displayName}
            pokemonId={pokemon.id}
          />

          {/* Pokemon Info - Always show types for consistency */}
          <PokemonInfo 
            displayName={displayName}
            pokemonId={pokemon.id}
            types={pokemon.types}
          />

          {/* CRITICAL FIX: Loading overlay that keeps Pokemon visible */}
          <LoadingOverlay isVisible={isProcessing} />
        </div>
      </CardContent>
    </Card>
  );
});

BattleCard.displayName = "BattleCard";

export default BattleCard;
