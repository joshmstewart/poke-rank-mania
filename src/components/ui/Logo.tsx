
import React from "react";

export const Logo: React.FC = () => {
  return (
    <div className="relative inline-flex items-center">
      {/* Pokemon logo container */}
      <div className="mr-2">
        <span className="font-bold text-3xl md:text-4xl tracking-wider" style={{
          color: "#ffcb05", // Pokemon yellow color
          textShadow: "0 3px 6px rgba(0, 0, 0, 0.6), 5px 2px 0 #3761a8, -5px -5px 0 #3761a8, 5px -5px 0 #3761a8, -5px 5px 0 #3761a8", // Much thicker blue outline (#3761a8)
          fontFamily: "'Arial', sans-serif",
          letterSpacing: "0.05em",
        }}>
          Pokémon
        </span>
      </div>
      
      {/* Rank Mania text */}
      <div className="relative">
        <span className="font-bold text-2xl md:text-3xl text-white bg-[#ea384c] px-3 py-1 rounded-md shadow-md" style={{
          textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
          fontFamily: "'Arial', sans-serif",
          letterSpacing: "0.03em",
        }}>
          Rank Mania
        </span>
        {/* Pokeball-inspired circle with updated colors */}
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-1/3 w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full border border-[#8E9196]"></div>
        </div>
      </div>
    </div>
  );
};

export default Logo;
