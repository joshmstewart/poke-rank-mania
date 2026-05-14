
import { useCallback } from "react";

interface TCGHandlersProps {
  displayName: string;
  pokemonId: number;
  onSelect: (id: number) => void;
  isProcessing: boolean;
  clickTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  lastClickTimeRef: React.MutableRefObject<number>;
  modalOpen: boolean;
  setIsHovered: (hovered: boolean) => void;
  setModalOpen: (open: boolean) => void;
}

export const useTCGBattleCardHandlers = ({
  displayName,
  pokemonId,
  onSelect,
  isProcessing,
  clickTimeoutRef,
  lastClickTimeRef,
  modalOpen,
  setIsHovered,
  setModalOpen
}: TCGHandlersProps) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [TCG_BATTLE_CARD] ${displayName}: Card clicked`);
    
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button]') || 
        target.closest('[role="dialog"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [TCG_BATTLE_CARD] Info dialog interaction for ${displayName}, preventing card selection`);
      return;
    }

    const now = Date.now();
    
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 [TCG_BATTLE_CARD] Ignoring rapid click on ${displayName}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    console.log(`🖱️ [TCG_BATTLE_CARD] Click on ${displayName} (${pokemonId}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemonId);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemonId, displayName, onSelect, isProcessing, clickTimeoutRef, lastClickTimeRef]);

  const handleMouseEnter = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse enter - modalOpen: ${modalOpen}, isProcessing: ${isProcessing}`);
    if (!isProcessing && !modalOpen) {
      setIsHovered(true);
    }
  }, [isProcessing, modalOpen, displayName, setIsHovered]);

  const handleMouseLeave = useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse leave`);
    setIsHovered(false);
  }, [displayName, setIsHovered]);

  const handleInfoButtonInteraction = useCallback((e: React.MouseEvent) => {
    console.log(`🔘 [TCG_BATTLE_CARD] ${displayName}: Info button interaction`);
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
  }, [displayName, setIsHovered]);

  const handleModalStateChange = useCallback((open: boolean) => {
    console.log(`🔘 [MODAL_DEBUG] TCGBattleCard ${displayName}: Modal state changing to ${open}`);
    setModalOpen(open);
    setIsHovered(false);
  }, [displayName, setModalOpen, setIsHovered]);

  return {
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleInfoButtonInteraction,
    handleModalStateChange
  };
};
