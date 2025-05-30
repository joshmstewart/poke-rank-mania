
import { useRef } from "react";
import { useAutoScrollEffects } from "./autoScroll/useAutoScrollEffects";

export const useAutoScroll = (itemCount: number, isRankingArea: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(itemCount);
  const isAtLastCardOnlyRef = useRef(false);
  const autoAdjustModeRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  console.log(`🔍 [AUTO_SCROLL_DEBUG] Hook called - itemCount: ${itemCount}, isRankingArea: ${isRankingArea}`);

  const refs = {
    containerRef,
    previousCountRef,
    isAtLastCardOnlyRef,
    autoAdjustModeRef,
    lastScrollTopRef
  };

  useAutoScrollEffects(refs, itemCount, isRankingArea);

  return { containerRef };
};
