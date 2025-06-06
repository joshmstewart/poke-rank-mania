
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthenticatedUserDisplay } from "@/components/auth/AuthenticatedUserDisplay";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { HelpButton } from "@/components/tour/HelpButton";

export const SaveProgressSection = () => {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <HelpButton />
      {user ? (
        <AuthenticatedUserDisplay />
      ) : (
        <AuthDialog />
      )}
    </div>
  );
};
