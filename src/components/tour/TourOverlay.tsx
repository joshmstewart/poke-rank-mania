
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTour } from './TourProvider';

export const TourOverlay: React.FC = () => {
  const { isActive, currentStep, steps, endTour, nextStep, prevStep } = useTour();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      
      // Scroll target into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Calculate overlay position
      const rect = target.getBoundingClientRect();
      const position = steps[currentStep].position || 'bottom';
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }
      
      setOverlayPosition({ top, left });
    }
  }, [isActive, currentStep, steps]);

  if (!isActive || !steps[currentStep] || !targetElement) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Highlight circle around target */}
      <div 
        className="absolute border-4 border-blue-500 rounded-lg shadow-lg pointer-events-none"
        style={{
          top: targetElement.getBoundingClientRect().top - 8,
          left: targetElement.getBoundingClientRect().left - 8,
          width: targetElement.getBoundingClientRect().width + 16,
          height: targetElement.getBoundingClientRect().height + 16,
        }}
      />
      
      {/* Tour card */}
      <Card 
        className="absolute pointer-events-auto bg-white p-4 shadow-xl max-w-sm"
        style={{
          top: overlayPosition.top,
          left: Math.min(overlayPosition.left, window.innerWidth - 300),
          transform: 'translateX(-50%)'
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={endTour}
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {currentStepData.content}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={nextStep}
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
