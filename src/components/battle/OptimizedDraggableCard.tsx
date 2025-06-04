
import React, { memo, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface OptimizedDraggableCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  context?: 'available' | 'ranked';
}

const OptimizedDraggableCard: React.FC<OptimizedDraggableCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  context = 'ranked'
}) => {
  console.log(`🚀 [CARD_DEBUG] ===== OPTIMIZED DRAGGABLE CARD RENDER START =====`);
  console.log(`🚀 [CARD_DEBUG] Pokemon: ${pokemon.name} (ID: ${pokemon.id})`);
  console.log(`🚀 [CARD_DEBUG] Context: ${context}`);
  console.log(`🚀 [CARD_DEBUG] isDraggable: ${isDraggable}`);

  // CRITICAL FIX: Use consistent ID formats for proper drag interaction
  const sortableId = context === 'available' ? `available-${pokemon.id}` : `ranking-${pokemon.id}`;
  
  console.log(`🔧 [HOOK_DEBUG] Card ${pokemon.name} using ID: ${sortableId} (context: ${context})`);
  console.log(`🔧 [HOOK_DEBUG] About to initialize ${context === 'available' ? 'useDraggable' : 'useSortable'} hook`);

  // For Available Pokemon: Use useDraggable only (no sorting)
  // For Ranked Pokemon: Use useSortable (for reordering within rankings)
  let dragAttributes, dragListeners, setNodeRef, isDragging, transform, transition;

  if (context === 'available') {
    console.log(`🔧 [HOOK_DEBUG] ===== INITIALIZING DRAGGABLE HOOK =====`);
    console.log(`🔧 [HOOK_DEBUG] Draggable ID: ${sortableId}`);
    console.log(`🔧 [HOOK_DEBUG] isDraggable: ${isDraggable}`);
    
    // Available Pokemon: draggable but not sortable
    const draggableConfig = {
      id: sortableId,
      disabled: !isDraggable,
      data: {
        type: 'available-pokemon',
        pokemon: pokemon,
        source: context,
        index
      }
    };

    console.log(`🔧 [HOOK_DEBUG] Available Draggable Config:`, draggableConfig);
    
    try {
      const draggableResult = useDraggable(draggableConfig);
      dragAttributes = draggableResult.attributes;
      dragListeners = draggableResult.listeners;
      setNodeRef = draggableResult.setNodeRef;
      isDragging = draggableResult.isDragging;
      transform = null;
      transition = null;
      
      console.log(`🔧 [HOOK_DEBUG] ===== DRAGGABLE HOOK INITIALIZED SUCCESSFULLY =====`);
      console.log(`🔧 [HOOK_DEBUG] Has attributes: ${!!dragAttributes}`);
      console.log(`🔧 [HOOK_DEBUG] Has listeners: ${!!dragListeners}`);
      console.log(`🔧 [HOOK_DEBUG] Has setNodeRef: ${!!setNodeRef}`);
      console.log(`🔧 [HOOK_DEBUG] isDragging: ${isDragging}`);
    } catch (error) {
      console.error(`🚨 [HOOK_ERROR] Failed to initialize useDraggable for ${pokemon.name}:`, error);
      // Fallback values
      dragAttributes = {};
      dragListeners = {};
      setNodeRef = () => {};
      isDragging = false;
      transform = null;
      transition = null;
    }
    
    // Add initialization logging
    useEffect(() => {
      console.log(`🎯 [DRAGGABLE_INIT] ===== DRAGGABLE INITIALIZATION EFFECT =====`);
      console.log(`🎯 [DRAGGABLE_INIT] Available Pokemon initialized: ${sortableId}`);
      console.log(`🎯 [DRAGGABLE_INIT] Pokemon name: ${pokemon.name}`);
      console.log(`🎯 [DRAGGABLE_INIT] isDraggable: ${isDraggable}`);
      console.log(`🎯 [DRAGGABLE_INIT] Context: ${context}`);
      console.log(`🎯 [DRAGGABLE_INIT] Timestamp: ${new Date().toISOString()}`);
    }, [sortableId, pokemon.name, isDraggable, context]);
  } else {
    console.log(`🔧 [HOOK_DEBUG] ===== INITIALIZING SORTABLE HOOK =====`);
    console.log(`🔧 [HOOK_DEBUG] Sortable ID: ${sortableId}`);
    
    // Ranked Pokemon: sortable within their grid
    const sortableConfig = {
      id: sortableId,
      disabled: !isDraggable,
      data: {
        type: 'ranked-pokemon',
        pokemon: pokemon,
        source: context,
        index
      }
    };

    console.log(`🔧 [HOOK_DEBUG] Ranking Sortable Config:`, sortableConfig);
    
    try {
      const sortableResult = useSortable(sortableConfig);
      dragAttributes = sortableResult.attributes;
      dragListeners = sortableResult.listeners;
      setNodeRef = sortableResult.setNodeRef;
      isDragging = sortableResult.isDragging;
      transform = sortableResult.transform;
      transition = sortableResult.transition;
      
      console.log(`🔧 [HOOK_DEBUG] ===== SORTABLE HOOK INITIALIZED SUCCESSFULLY =====`);
      console.log(`🔧 [HOOK_DEBUG] Has attributes: ${!!dragAttributes}`);
      console.log(`🔧 [HOOK_DEBUG] Has listeners: ${!!dragListeners}`);
      console.log(`🔧 [HOOK_DEBUG] Has setNodeRef: ${!!setNodeRef}`);
      console.log(`🔧 [HOOK_DEBUG] isDragging: ${isDragging}`);
    } catch (error) {
      console.error(`🚨 [HOOK_ERROR] Failed to initialize useSortable for ${pokemon.name}:`, error);
      // Fallback values
      dragAttributes = {};
      dragListeners = {};
      setNodeRef = () => {};
      isDragging = false;
      transform = null;
      transition = null;
    }
    
    // Add initialization logging
    useEffect(() => {
      console.log(`🎯 [SORTABLE_INIT] ===== SORTABLE INITIALIZATION EFFECT =====`);
      console.log(`🎯 [SORTABLE_INIT] Ranking Pokemon initialized: ${sortableId}`);
      console.log(`🎯 [SORTABLE_INIT] Pokemon name: ${pokemon.name}`);
      console.log(`🎯 [SORTABLE_INIT] isDraggable: ${isDraggable}`);
      console.log(`🎯 [SORTABLE_INIT] Context: ${context}`);
      console.log(`🎯 [SORTABLE_INIT] Timestamp: ${new Date().toISOString()}`);
    }, [sortableId, pokemon.name, isDraggable, context]);
  }

  // Log hook results
  console.log(`🔧 [HOOK_RESULT] ${pokemon.name} (${context}): dragAttributes exists: ${!!dragAttributes}, listeners exists: ${!!dragListeners}`);

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  
  // Only apply drag props if draggable to prevent conflicts
  const dragProps = isDraggable ? { ...dragAttributes, ...dragListeners } : {};
  
  console.log(`🔧 [DRAG_PROPS] ${pokemon.name}: Applied drag props:`, Object.keys(dragProps));

  // Apply transform for sortable items
  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  const cardClassName = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
    isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
  } ${
    isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400' : 'hover:shadow-lg transition-all duration-200'
  } ${
    isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
  }`;

  // Fix the currentRank type issue
  const getCurrentRank = (): number | null => {
    if ('currentRank' in pokemon && typeof pokemon.currentRank === 'number') {
      return pokemon.currentRank;
    }
    return null;
  };

  console.log(`🚀 [CARD_DEBUG] ===== OPTIMIZED DRAGGABLE CARD RENDER END =====`);
  console.log(`🚀 [CARD_DEBUG] Final render for ${pokemon.name} with ID ${sortableId}`);

  return (
    <div
      ref={setNodeRef}
      className={cardClassName}
      style={style}
      {...dragProps}
    >
      <PokemonMilestoneOverlays
        context={context}
        isRankedPokemon={context === 'available' && 'isRanked' in pokemon ? Boolean(pokemon.isRanked) : false}
        currentRank={getCurrentRank()}
        isPending={isPending}
        showRank={showRank}
        index={index}
        isDragging={isDragging}
      />
      
      {!isDragging && (
        <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <PokemonInfoModal pokemon={pokemon}>
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
          </PokemonInfoModal>
        </div>
      )}
      
      <PokemonMilestoneImage
        pokemon={pokemon}
        isDragging={isDragging}
      />
      
      <PokemonMilestoneInfo
        pokemon={pokemon}
        isDragging={isDragging}
        context={context}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Comprehensive but efficient prop comparison
  const isEqual = (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.context === nextProps.context
  );
  
  console.log(`🚀 [MEMO_DEBUG] ${nextProps.pokemon.name}: ${isEqual ? 'PREVENTING' : 'ALLOWING'} re-render`);
  
  return isEqual;
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
