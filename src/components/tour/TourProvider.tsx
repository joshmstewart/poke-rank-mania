
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
  isActive: boolean;
  showSplash: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeSplash: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const tourSteps: TourStep[] = [
  {
    id: 'mode-switcher',
    title: 'Welcome to Pokemon Ranker!',
    content: 'Switch between Battle Mode and Manual Ranking Mode using these tabs.',
    target: '[data-tour="mode-switcher"]',
    position: 'bottom'
  },
  {
    id: 'generation-filter',
    title: 'Generation Filter',
    content: 'Filter Pokemon by generation to focus on specific eras of Pokemon.',
    target: '[data-tour="generation-filter"]',
    position: 'bottom'
  },
  {
    id: 'battle-mode',
    title: 'Battle Mode',
    content: 'In Battle Mode, choose your favorite Pokemon from the pairs shown to build rankings automatically.',
    target: '[data-tour="battle-mode-tab"]',
    position: 'bottom'
  },
  {
    id: 'manual-ranking',
    title: 'Manual Ranking Mode',
    content: 'In Manual Ranking Mode, you can drag and drop Pokemon to manually adjust their rankings.',
    target: '[data-tour="manual-ranking-tab"]',
    position: 'bottom'
  },
  {
    id: 'rankings-button',
    title: 'View Rankings',
    content: 'Click here to see your current rankings and compare Pokemon across both modes.',
    target: '[data-tour="rankings-button"]',
    position: 'left'
  }
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setShowSplash(true);
  }, []);

  const completeSplash = useCallback(() => {
    setShowSplash(false);
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setShowSplash(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  return (
    <TourContext.Provider value={{
      isActive,
      showSplash,
      currentStep,
      steps: tourSteps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      completeSplash
    }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
