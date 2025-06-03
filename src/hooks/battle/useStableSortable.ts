import { useSortable } from '@dnd-kit/sortable';
import { useMemo, useRef } from 'react';
import { CSS } from '@dnd-kit/utilities';

interface UseStableSortableProps {
  id: string | number;
  disabled?: boolean;
  data?: any;
}

// Custom hook to provide stable prop references from useSortable
export const useStableSortable = ({ id, disabled = false, data }: UseStableSortableProps) => {
  const sortableResult = useSortable({ id, disabled, data });
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  // Memoize attributes and listeners to prevent new references when unchanged
  const stableAttributes = useMemo(() => attributes, [
    attributes?.role,
    attributes?.tabIndex,
    attributes?.['aria-describedby'],
    attributes?.['aria-pressed']
  ]);

  const stableListeners = useMemo(() => listeners, [
    // Only recreate if the actual function references change
    listeners?.onPointerDown,
    listeners?.onKeyDown
  ]);

  // Memoize transform to prevent new objects for identical values
  const stableTransform = useMemo(() => {
    if (!transform) return null;
    
    // Create stable transform object only when values actually change
    return {
      x: transform.x || 0,
      y: transform.y || 0,
      scaleX: transform.scaleX || 1,
      scaleY: transform.scaleY || 1
    };
  }, [transform?.x, transform?.y, transform?.scaleX, transform?.scaleY]);

  // Memoize the CSS transform string
  const transformStyle = useMemo(() => {
    return CSS.Transform.toString(stableTransform);
  }, [stableTransform]);

  // Memoize the complete style object
  const style = useMemo(() => ({
    transform: transformStyle,
    transition: isDragging ? 'none' : transition,
  }), [transformStyle, isDragging, transition]);

  console.log(`🔧 [STABLE_SORTABLE] ${id}: Returning stabilized props - isDragging: ${isDragging}`);

  return {
    attributes: stableAttributes,
    listeners: stableListeners,
    setNodeRef,
    transform: stableTransform,
    transition,
    isDragging,
    style
  };
};
