
import React, { useEffect, useRef, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';

// Simplified test component to isolate the SortableContext re-render issue
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
  renderCount.current++;

  console.log(`🔍 [SORTABLE_DEBUGGER] ${pokemonName}: Render #${renderCount.current} STARTED`);

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

  // CRITICAL: Log exactly what useSortable returns and when it changes
  useEffect(() => {
    console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: useSortable returned new values`);
    console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: isDragging=${isDragging}, transform=${transform ? 'present' : 'null'}`);
    console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: attributes keys=${Object.keys(attributes || {}).join(',')}`);
    console.log(`🔍 [SORTABLE_HOOK_DEBUG] ${pokemonName}: listeners keys=${Object.keys(listeners || {}).join(',')}`);
  }, [attributes, listeners, transform, transition, isDragging, pokemonName]);

  // CRITICAL: Track any internal state changes
  const [localState, setLocalState] = React.useState(false);
  
  useEffect(() => {
    console.log(`🔍 [LOCAL_STATE_DEBUG] ${pokemonName}: localState changed to ${localState}`);
  }, [localState, pokemonName]);

  console.log(`🔍 [SORTABLE_DEBUGGER] ${pokemonName}: Render #${renderCount.current} COMPLETED`);

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
    </div>
  );
}, (prevProps, nextProps) => {
  const pokemonName = nextProps.pokemonName;
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
});

SortableContextDebugger.displayName = 'SortableContextDebugger';

export default SortableContextDebugger;
