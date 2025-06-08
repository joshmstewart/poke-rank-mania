
import React, { useState } from "react";
import { InteractiveTutorial } from "./InteractiveTutorial";
import { WelcomeSplash } from "./WelcomeSplash";

interface TutorialManagerProps {
  children: React.ReactNode;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStartSlide, setTutorialStartSlide] = useState(0);

  const startTutorial = (slideIndex: number = 0) => {
    setTutorialStartSlide(slideIndex);
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  const handleWelcomeStart = () => {
    startTutorial(0);
  };

  const handleWelcomeSkip = () => {
    // Just close welcome, don't start tutorial
  };

  return (
    <>
      {children}
      
      <WelcomeSplash 
        onStartTutorial={handleWelcomeStart}
        onSkip={handleWelcomeSkip}
      />
      
      <InteractiveTutorial
        isOpen={showTutorial}
        onClose={closeTutorial}
        startFromSlide={tutorialStartSlide}
      />
    </>
  );
};

// Export function to start tutorial from anywhere in the app
export const useTutorial = () => {
  const startTutorial = (slideIndex: number = 0) => {
    const event = new CustomEvent('start-tutorial', { detail: { slideIndex } });
    window.dispatchEvent(event);
  };

  return { startTutorial };
};
