
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TutorialSlide } from "./TutorialSlide";
import { tutorialSlides } from "./tutorialData";
import { highlightElement, removeHighlight } from "./tutorialUtils";

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  startFromSlide?: number;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isOpen,
  onClose,
  startFromSlide = 0
}) => {
  const [currentSlide, setCurrentSlide] = useState(startFromSlide);
  
  useEffect(() => {
    if (isOpen && tutorialSlides[currentSlide]?.highlightSelector) {
      highlightElement(tutorialSlides[currentSlide].highlightSelector!);
    }
    
    return () => {
      removeHighlight();
    };
  }, [isOpen, currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight' && currentSlide < tutorialSlides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide]);

  const handleClose = () => {
    removeHighlight();
    onClose();
    setCurrentSlide(0);
  };

  const nextSlide = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for highlighting */}
      <div className="fixed inset-0 z-[9999] pointer-events-none" id="tutorial-overlay" />
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 z-[10000]">
          <div className="relative h-full">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Tutorial content */}
            <div className="p-6 pb-20">
              <TutorialSlide slide={tutorialSlides[currentSlide]} />
            </div>

            {/* Navigation footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
              <div className="flex items-center justify-between">
                {/* Previous button */}
                <Button
                  variant="outline"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Slide indicators */}
                <div className="flex items-center gap-2">
                  {tutorialSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentSlide
                          ? 'bg-blue-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Next/Finish button */}
                {currentSlide < tutorialSlides.length - 1 ? (
                  <Button onClick={nextSlide} className="flex items-center gap-2">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                    Get Started!
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentSlide + 1) / tutorialSlides.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
