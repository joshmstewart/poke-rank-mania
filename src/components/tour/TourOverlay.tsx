import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTour } from './TourProvider';

export const TourOverlay: React.FC = () => {
  const { isActive, currentStep, steps, endTour, nextStep, prevStep } = useTour();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const updateTargetElement = () => {
      const target = document.querySelector(steps[currentStep].target) as HTMLElement;
      console.log('🎯 Tour: Looking for target:', steps[currentStep].target);
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
        
        // Center the tour card horizontally and position it lower
        const cardWidth = 320;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Center horizontally
        const left = (viewportWidth - cardWidth) / 2;
        
        // Position in lower third of viewport, with minimum distance from bottom
        const top = Math.max(
          viewportHeight * 0.65, // 65% down the viewport
          rect.bottom + 60 // At least 60px below the target
        );
        
        // Ensure it doesn't go off the bottom of the screen
        const finalTop = Math.min(top, viewportHeight - 250);
        
        setOverlayPosition({ top: finalTop, left });
      } else {
        console.warn('🎯 Tour: Target element not found:', steps[currentStep].target);
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
      
      {/* Tour card centered and positioned lower */}
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
