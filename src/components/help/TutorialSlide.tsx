
import React from "react";

export interface TutorialSlideData {
  id: string;
  title: string;
  content: React.ReactNode;
  highlightSelector?: string;
  image?: string;
}

interface TutorialSlideProps {
  slide: TutorialSlideData;
}

export const TutorialSlide: React.FC<TutorialSlideProps> = ({ slide }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{slide.title}</h2>
      </div>
      
      {slide.image && (
        <div className="flex justify-center">
          <img 
            src={slide.image} 
            alt={slide.title}
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}
      
      <div className="text-gray-700 space-y-4">
        {slide.content}
      </div>
    </div>
  );
};
