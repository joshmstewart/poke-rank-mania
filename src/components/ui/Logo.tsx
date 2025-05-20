
import React from "react";

export const Logo: React.FC = () => {
  return (
    <div className="relative inline-flex items-center">
      <div className="h-20 md:h-24">
        <img 
          src="/lovable-uploads/b96388f6-0ed5-4d92-b5ab-d9185d52bbd2.png" 
          alt="PokeRank Mania" 
          className="h-full w-auto object-contain"
          style={{ 
            maxWidth: "none",
            backgroundImage: "none"
          }}
        />
      </div>
    </div>
  );
};

export default Logo;
