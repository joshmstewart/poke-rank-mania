
import React, { useEffect, useRef, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';

// Simplified test component with REDUCED logging to focus on performance data
interface SortableContextDebuggerProps {
  pokemonId: number;
  pokemonName: string;
  index: number;
}

const SortableContextDebugger: React.FC<SortableContextDebuggerProps> = React.memo(({ 
  pokemonId, 
  pokemonName, 
  index 
}) => {
  const renderCount = useRef(0);
  const prevPropsRef = useRef({ attributes: null, listeners: null, transform: null, transition: null, isDragging: false });
  renderCount.current++;

  // REDUCED: Only log for first item to minimize noise
  if (index === 0) {
    console.log(`🔍 [SORTABLE_DEBUGGER] ${pokemonName}: Render #${renderCount.current} STARTED`);
  }

  // CRITICAL: Minimal useSortable configuration to test @dnd-kit's behavior
  const sortableConfig = useMemo(() => ({
    id: pokemonId,
    disabled: false,
    data: {
      type: 'test-pokemon',
      pokemon: { id: pokemonId, name: pokemonName },
      index
    }
  }), [pokemonId, pokemonName, index]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable(sortableConfig);

  // REDUCED: Track changes only for first item
  useEffect(() => {
    if (index === 0) {
      const prev = prevPropsRef.current;
      const hasAttributesChanged = prev.attributes !== attributes;
      const hasListenersChanged = prev.listeners !== listeners;
      const hasTransformChanged = prev.transform !== transform;
      const hasTransitionChanged = prev.transition !== transition;
      const hasIsDraggingChanged = prev.isDragging !== isDragging;
      
      if (hasAttributesChanged || hasListenersChanged || hasTransformChanged || hasTransitionChanged || hasIsDraggingChanged) {
        console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: useSortable returned NEW values:`);
        console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: - transform changed: ${hasTransformChanged} (${transform ? `${transform.x},${transform.y}` : 'null'})`);
        console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: - isDragging changed: ${hasIsDraggingChanged} (${isDragging})`);
        
        // Store current values for next comparison
        prevPropsRef.current = { attributes, listeners, transform, transition, isDragging };
      }
    }
  }, [attributes, listeners, transform, transition, isDragging, pokemonName, index]);

  if (index === 0) {
    console.log(`🔍 [SORTABLE_DEBUGGER] ${pokemonName}: Render #${renderCount.current} COMPLETED`);
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? 'none' : transition,
      }}
      className="w-20 h-20 bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-xs cursor-grab"
    >
      {pokemonName.slice(0, 8)}
      <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded">
        {renderCount.current}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  const pokemonName = nextProps.pokemonName;
  
  // REDUCED: Only log memo decisions for first item
  if (nextProps.index === 0) {
    console.log(`🔍 [DEBUGGER_MEMO] ${pokemonName}: Memo comparison starting`);
    
    const propsChanged = (
      prevProps.pokemonId !== nextProps.pokemonId ||
      prevProps.pokemonName !== nextProps.pokemonName ||
      prevProps.index !== nextProps.index
    );
    
    if (propsChanged) {
      console.log(`🔍 [DEBUGGER_MEMO] ${pokemonName}: Props changed - ALLOWING RE-RENDER`);
      return false;
    } else {
      console.log(`🔍 [DEBUGGER_MEMO] ${pokemonName}: No prop changes - PREVENTING RE-RENDER`);
      return true;
    }
  }
  
  // For all other items, just do the comparison without logging
  return (
    prevProps.pokemonId === nextProps.pokemonId &&
    prevProps.pokemonName === nextProps.pokemonName &&
    prevProps.index === nextProps.index
  );
});

SortableContextDebugger.displayName = 'SortableContextDebugger';

export default SortableContextDebugger;
