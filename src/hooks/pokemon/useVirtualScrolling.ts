
import { useState, useEffect, useRef, useMemo } from "react";

interface UseVirtualScrollingProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScrolling = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualScrollingProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
    
    return { startIndex, endIndex, visibleCount };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      virtualIndex: visibleRange.startIndex + index,
      actualIndex: visibleRange.startIndex + index
    }));
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // DEBUG INFO: Log virtual scrolling stats for performance monitoring
  useEffect(() => {
    if (items.length > 100) {
      console.log(`🎯 [VIRTUAL_SCROLL_DEBUG] Optimizing ${items.length} items, showing ${visibleItems.length} (${visibleRange.startIndex}-${visibleRange.endIndex})`);
    }
  }, [items.length, visibleItems.length, visibleRange.startIndex, visibleRange.endIndex]);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
};
