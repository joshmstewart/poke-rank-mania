
import React from "react";
import Logo from "@/components/ui/Logo";

const PokemonModalLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="animate-pulse">
        <Logo />
      </div>
      <p className="text-lg font-medium text-gray-600">Loading card data...</p>
    </div>
  );
};

export default PokemonModalLoading;
