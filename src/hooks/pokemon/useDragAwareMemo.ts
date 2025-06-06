
import { useMemo, useRef } from "react";

interface UseDragAwareMemoProps<T> {
  value: T;
  isDragging: boolean;
  deps: React.DependencyList;
}

export const useDragAwareMemo = <T>({ value, isDragging, deps }: UseDragAwareMemoProps<T>): T => {
  const frozenValueRef = useRef<T>(value);
  
  // Only update the frozen value when not dragging
  const memoizedValue = useMemo(() => {
    if (!isDragging) {
      frozenValueRef.current = value;
    }
    return frozenValueRef.current;
  }, [isDragging, ...deps]);

  return memoizedValue;
};
