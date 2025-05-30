
import React from "react";

const LogoSection: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="h-24 flex items-center py-2 px-4">
        <img 
          src="/lovable-uploads/008c1959-1f2a-4416-9d73-9f706e384331.png" 
          alt="PokeRank Mania" 
          className="w-auto object-contain"
          style={{ height: '150px', width: 'auto' }}
        />
      </div>
    </div>
  );
};

export default LogoSection;
