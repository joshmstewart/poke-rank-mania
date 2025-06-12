
import React from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const SaveProgressSection: React.FC = () => {
  return (
    <div className="flex items-center">
      <AuthDialog>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Sign In
        </Button>
      </AuthDialog>
    </div>
  );
};
