
import React from 'react';

export const SplashPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Pokémon Ranker</h1>
        <p className="text-white/80 text-lg">Loading your adventure...</p>
      </div>
    </div>
  );
};
