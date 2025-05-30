
import React from 'react';

const TCGModeInfo: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">TCG Card Mode</h4>
      <p className="text-sm text-blue-700">
        In this mode, you'll battle with real Pokémon Trading Card Game cards. 
        Cards will be loaded dynamically during battles for an authentic TCG experience.
      </p>
    </div>
  );
};

export default TCGModeInfo;
