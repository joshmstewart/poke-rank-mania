
import React from 'react';

export const SplashBackground: React.FC = () => {
  return (
    <div className="absolute inset-0">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />
      
      {/* Animated Liquid Glass Layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Liquid Flow */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="liquid-blob liquid-blob-1" />
          <div className="liquid-blob liquid-blob-2" />
          <div className="liquid-blob liquid-blob-3" />
        </div>
        
        {/* Glass Morphism Overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-white/5 to-transparent" />
        
        {/* Floating Particles */}
        <div className="particles-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid-pattern" />
      </div>
    </div>
  );
};
