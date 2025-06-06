
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthenticatedUserDisplay } from "@/components/auth/AuthenticatedUserDisplay";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { HelpButton } from "@/components/tour/HelpButton";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const SaveProgressSection = () => {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <HelpButton />
      {user ? (
        <AuthenticatedUserDisplay />
      ) : (
        <AuthDialog>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sign In
          </Button>
        </AuthDialog>
      )}
    </div>
  );
};
