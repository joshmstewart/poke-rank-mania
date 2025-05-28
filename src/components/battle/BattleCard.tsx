import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { getPreferredImage, ImageType } from "@/utils/imageUtils";
import PokemonImage from "./PokemonImage";
import PokemonInfo from "./PokemonInfo";
import LoadingOverlay from "./LoadingOverlay";

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
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);

  // CRITICAL FIX: Use the Pokemon name directly (it should already be formatted by validateBattlePokemon)
  const displayName = pokemon.name;
  
  console.log(`🎯 [BATTLE_CARD_CRITICAL] Pokemon ${pokemon.id}: using name "${displayName}"`);
  console.log(`🎯 [LOADING_CIRCLES] BattleCard ${displayName} received isProcessing: ${isProcessing}`);
  
  // CRITICAL FIX: Don't hide Pokemon during processing - show loading overlay instead
  if (isProcessing) {
    console.log(`🟡 [LOADING_CIRCLES] BattleCard ${displayName} SHOWING loading state`);
  } else {
    console.log(`🟢 [LOADING_CIRCLES] BattleCard ${displayName} NOT showing loading state`);
  }

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(() => {
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

  const preferredImageType: ImageType = 
    (localStorage.getItem('preferredImageType') as ImageType) || 'official';
  
  console.log(`🖼️ [DEV] Getting preferred image type: ${preferredImageType}`);
  
  const imageUrl = getPreferredImage(pokemon, preferredImageType);
  
  console.log(`🏆 BattleCard: Rendering Pokemon ${displayName} (#${pokemon.id}) with isSelected=${isSelected}`);
  console.log(`🖼️ BattleCard: Loading "${preferredImageType}" image for ${displayName} (#${pokemon.id}): ${imageUrl}`);

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform hover:scale-105 
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
  `.trim();

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* CRITICAL FIX: Keep Pokemon visible, add loading overlay instead */}
        <div className="relative">
          {/* Pokemon Image */}
          <PokemonImage 
            imageUrl={imageUrl}
            displayName={displayName}
            pokemonId={pokemon.id}
          />

          {/* Pokemon Info */}
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
