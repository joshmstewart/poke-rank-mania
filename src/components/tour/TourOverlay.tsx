
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTour } from './TourProvider';
import { Logo } from '@/components/ui/Logo';

export const TourOverlay: React.FC = () => {
  const { isActive, currentStep, steps, endTour, nextStep, prevStep } = useTour();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const currentStepData = steps[currentStep];
    
    // Skip target finding for splash step
    if (currentStepData.isSplash) {
      setTargetElement(null);
      return;
    }

    const updateTargetElement = () => {
      const target = document.querySelector(currentStepData.target!) as HTMLElement;
      console.log('🎯 Tour: Looking for target:', currentStepData.target);
      console.log('🎯 Tour: Found target:', target);
      
      if (target) {
        setTargetElement(target);
        
        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Calculate highlight position
        const rect = target.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });
        
        // Center the tour card horizontally and position it moderately lower
        const cardWidth = 320;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Center horizontally
        const left = (viewportWidth - cardWidth) / 2;
        
        // Position at about 50% down the viewport, with minimum distance from bottom
        const top = Math.max(
          viewportHeight * 0.5, // 50% down the viewport (moved up from 65%)
          rect.bottom + 40 // At least 40px below the target
        );
        
        // Ensure it doesn't go off the bottom of the screen
        const finalTop = Math.min(top, viewportHeight - 250);
        
        setOverlayPosition({ top: finalTop, left });
      } else {
        console.warn('🎯 Tour: Target element not found:', currentStepData.target);
        setTargetElement(null);
      }
    };

    // Initial update
    updateTargetElement();
    
    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateTargetElement, 100);
    
    // Listen for window resize
    const handleResize = () => updateTargetElement();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, currentStep, steps]);

  if (!isActive || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];

  // Render splash step with larger card and centered layout
  if (currentStepData.isSplash) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Large centered splash card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 shadow-xl max-w-md w-full mx-4 text-center border-0">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={endTour}
                className="p-1 h-auto text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <Logo />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">{currentStepData.title}</h3>
            
            <p className="text-white/90 text-base mb-8 leading-relaxed">
              {currentStepData.content}
            </p>
            
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm font-medium">
                {currentStep + 1} of {steps.length}
              </span>
              
              <Button
                size="sm"
                onClick={nextStep}
                className="flex items-center bg-white text-indigo-600 hover:bg-white/90"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Render regular tour steps
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Highlight border around target */}
      {targetElement && (
        <div 
          className="absolute border-4 border-blue-500 rounded-lg shadow-lg pointer-events-none transition-all duration-300 ease-in-out"
          style={{
            top: highlightPosition.top,
            left: highlightPosition.left,
            width: highlightPosition.width,
            height: highlightPosition.height,
          }}
        />
      )}
      
      {/* Tour card centered and positioned moderately lower */}
      <Card 
        className="absolute pointer-events-auto bg-white p-6 shadow-xl transition-all duration-300 ease-in-out"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
          width: '320px',
          zIndex: 60
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={endTour}
            className="p-1 h-auto -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {currentStepData.content}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">
            {currentStep + 1} of {steps.length}
          </span>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={nextStep}
              className="flex items-center"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
