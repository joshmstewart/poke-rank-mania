
import { useState, useCallback, useRef, useEffect } from "react";
import { getCurrentImageMode } from "@/components/settings/imagePreferenceHelpers";

export const useTCGBattleCardState = () => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageMode, setCurrentImageMode] = useState<'pokemon' | 'tcg'>(() => getCurrentImageMode());

  return {
    clickTimeoutRef,
    lastClickTimeRef,
    isHovered,
    setIsHovered,
    modalOpen,
    setModalOpen,
    currentImageMode,
    setCurrentImageMode
  };
};

export const useTCGImageModeListener = (setCurrentImageMode: (mode: 'pokemon' | 'tcg') => void) => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pokemon-image-mode") {
        const newMode = getCurrentImageMode();
        console.log(`🃏 [TCG_BATTLE_CARD] Image mode changed to: ${newMode} (Storage event)`);
        setCurrentImageMode(newMode);
      }
    };

    const handlePreferencesSaved = (e: CustomEvent) => {
      const newMode = e.detail.mode;
      console.log(`🃏 [TCG_BATTLE_CARD] Image mode changed to: ${newMode} (Done clicked)`);
      setCurrentImageMode(newMode);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pokemon-preferences-saved', handlePreferencesSaved as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pokemon-preferences-saved', handlePreferencesSaved as EventListener);
    };
  }, [setCurrentImageMode]);
};

export const useTCGCleanupEffect = (displayName: string, clickTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
  useEffect(() => {
    console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: Component mounted/updated`);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayName, clickTimeoutRef]);
};

export const useTCGModalEffect = (modalOpen: boolean, displayName: string, setIsHovered: (hovered: boolean) => void) => {
  useEffect(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Modal state changed to ${modalOpen}`);
    setIsHovered(false);
  }, [modalOpen, displayName, setIsHovered]);
};
