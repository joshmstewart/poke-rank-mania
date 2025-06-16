
import React, { createContext, useContext, useState, useCallback } from 'react';
import { DndContext, DragOverlay, rectIntersection, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from '@/services/pokemon';

interface DragState {
  activePokemon: Pokemon | RankedPokemon | null;
  sourceContext: 'available' | 'ranked' | null;
  sourceIndex: number;
}

interface UnifiedDragContextType {
  dragState: DragState;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  registerDragHandlers: (handlers: DragHandlers) => void;
}

interface DragHandlers {
  onAvailableToRanked: (pokemonId: number, insertionIndex: number, pokemon: Pokemon | RankedPokemon) => void;
  onRankedReorder: (pokemonId: number, oldIndex: number, newIndex: number) => void;
  getAvailablePokemon: () => (Pokemon | RankedPokemon)[];
  getRankedPokemon: () => (Pokemon | RankedPokemon)[];
}

const UnifiedDragContext = createContext<UnifiedDragContextType | null>(null);

export const useUnifiedDrag = () => {
  const context = useContext(UnifiedDragContext);
  if (!context) {
    throw new Error('useUnifiedDrag must be used within UnifiedDragProvider');
  }
  return context;
};

export const UnifiedDragProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dragState, setDragState] = useState<DragState>({
    activePokemon: null,
    sourceContext: null,
    sourceIndex: -1,
  });

  const [dragHandlers, setDragHandlers] = useState<DragHandlers | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    const activeData = event.active.data.current;
    
    console.log(`🎯 [UNIFIED_DRAG] Drag started - ID: ${activeId}, Type: ${activeData?.type}`);

    if (!dragHandlers) return;

    let pokemon: Pokemon | RankedPokemon | null = null;
    let sourceContext: 'available' | 'ranked' | null = null;
    let sourceIndex = -1;

    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      const availablePokemon = dragHandlers.getAvailablePokemon();
      const index = availablePokemon.findIndex(p => p.id === pokemonId);
      if (index !== -1) {
        pokemon = availablePokemon[index];
        sourceContext = 'available';
        sourceIndex = index;
      }
    } else {
      const pokemonId = parseInt(activeId);
      const rankedPokemon = dragHandlers.getRankedPokemon();
      const index = rankedPokemon.findIndex(p => p.id === pokemonId);
      if (index !== -1) {
        pokemon = rankedPokemon[index];
        sourceContext = 'ranked';
        sourceIndex = index;
      }
    }

    setDragState({
      activePokemon: pokemon,
      sourceContext,
      sourceIndex,
    });
  }, [dragHandlers]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    console.log(`🎯 [UNIFIED_DRAG] Drag ended - Active: ${active.id}, Over: ${over?.id || 'none'}`);

    if (!over || !dragHandlers || !dragState.activePokemon) {
      setDragState({ activePokemon: null, sourceContext: null, sourceIndex: -1 });
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const overData = over.data.current;

    // Handle available to ranked
    if (dragState.sourceContext === 'available') {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      let insertionIndex = -1;

      if (overData?.type === 'ranked-pokemon') {
        const rankedPokemon = dragHandlers.getRankedPokemon();
        const targetIndex = rankedPokemon.findIndex(p => p.id === parseInt(overId));
        insertionIndex = targetIndex !== -1 ? targetIndex : rankedPokemon.length;
      } else if (overId === 'rankings-grid-drop-zone' || overData?.type === 'rankings-grid') {
        insertionIndex = dragHandlers.getRankedPokemon().length;
      }

      if (insertionIndex !== -1) {
        dragHandlers.onAvailableToRanked(pokemonId, insertionIndex, dragState.activePokemon);
      }
    }
    // Handle ranked reorder
    else if (dragState.sourceContext === 'ranked' && overData?.type === 'ranked-pokemon') {
      const pokemonId = parseInt(activeId);
      const rankedPokemon = dragHandlers.getRankedPokemon();
      const newIndex = rankedPokemon.findIndex(p => p.id === parseInt(overId));
      
      if (newIndex !== -1 && newIndex !== dragState.sourceIndex) {
        dragHandlers.onRankedReorder(pokemonId, dragState.sourceIndex, newIndex);
      }
    }

    setDragState({ activePokemon: null, sourceContext: null, sourceIndex: -1 });
  }, [dragState, dragHandlers]);

  const registerDragHandlers = useCallback((handlers: DragHandlers) => {
    setDragHandlers(handlers);
  }, []);

  const value: UnifiedDragContextType = {
    dragState,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    registerDragHandlers,
  };

  return (
    <UnifiedDragContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {dragState.activePokemon && (
            <div className="transform rotate-2 scale-105 opacity-95 z-50">
              <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xl min-w-[140px]">
                <img 
                  src={dragState.activePokemon.image} 
                  alt={dragState.activePokemon.name}
                  className="w-16 h-16 mx-auto mb-2 object-contain"
                />
                <div className="text-center">
                  <div className="font-bold text-sm">{dragState.activePokemon.name}</div>
                  <div className="text-xs text-gray-500">#{dragState.activePokemon.id.toString().padStart(3, '0')}</div>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </UnifiedDragContext.Provider>
  );
};
