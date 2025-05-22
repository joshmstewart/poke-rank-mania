
import React from "react";

export const Logo: React.FC = () => {
  return (
    <div className="relative inline-flex items-center">
      <div className="h-[157px] md:h-[189px]">
        <img 
          src="/lovable-uploads/008c1959-1f2a-4416-9d73-9f706e384331.png" 
          alt="PokeRank Mania" 
          className="h-full w-auto object-contain"
          style={{ 
            maxWidth: "none",
            backgroundImage: "none",
            maxHeight: "none"
          }}
        />
      </div>
    </div>
  );
};

export default Logo;
