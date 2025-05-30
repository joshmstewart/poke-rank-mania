
import React from "react";
import Logo from "@/components/ui/Logo";

const TCGCardLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="animate-pulse">
        <Logo />
      </div>
      <p className="text-sm text-gray-600">Loading card...</p>
    </div>
  );
};

export default TCGCardLoading;
