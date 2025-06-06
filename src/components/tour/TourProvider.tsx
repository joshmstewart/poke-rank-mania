
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
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
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
    id: 'battle-area',
    title: 'Battle Arena',
    content: 'In Battle Mode, choose your favorite Pokemon from the pairs shown to build rankings.',
    target: '[data-tour="battle-area"]',
    position: 'top'
  },
  {
    id: 'progress-tracker',
    title: 'Progress Tracking',
    content: 'Track your battle progress and see how many Pokemon you\'ve ranked.',
    target: '[data-tour="progress-tracker"]',
    position: 'bottom'
  },
  {
    id: 'rankings-view',
    title: 'View Rankings',
    content: 'Click here to see your current rankings and drag to manually reorder Pokemon.',
    target: '[data-tour="rankings-view"]',
    position: 'left'
  }
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
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
      currentStep,
      steps: tourSteps,
      startTour,
      endTour,
      nextStep,
      prevStep
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
