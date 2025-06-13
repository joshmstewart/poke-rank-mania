
import React from 'react';

interface LoadingIndicatorProps {
  progress: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ progress }) => {
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="w-64 h-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Animated Dots */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    </div>
  );
};
