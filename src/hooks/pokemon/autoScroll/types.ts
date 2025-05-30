
export interface ScrollDetectionHooks {
  checkIfAtLastCardOnly: () => boolean;
  checkIfScrolledToBottom: () => boolean;
}

export interface ScrollToLastCardHook {
  scrollToLastCardOnly: () => void;
}

export interface AutoScrollRefs {
  containerRef: React.RefObject<HTMLDivElement>;
  previousCountRef: React.MutableRefObject<number>;
  isAtLastCardOnlyRef: React.MutableRefObject<boolean>;
  autoAdjustModeRef: React.MutableRefObject<boolean>;
  lastScrollTopRef: React.MutableRefObject<number>;
}
