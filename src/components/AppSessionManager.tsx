
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Save, Cloud, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCloudSync } from "@/hooks/useCloudSync";
import {
  loadUnifiedSessionData,
  saveUnifiedSessionData,
  importUnifiedSessionData
} from "@/services/pokemonService";

const AppSessionManager = () => {
  const { user } = useAuth();
  
  console.log('🟠🟠🟠 AppSessionManager: RENDER START - Component is rendering');
  console.log('🟠🟠🟠 AppSessionManager: Auth state:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  // CRITICAL: If user is signed in, don't show anything - SaveProgressSection handles authenticated display
  if (user) {
    console.log('🟠🟠🟠 AppSessionManager: ✅ User IS authenticated - RETURNING NULL (should not render anything)');
    return null;
  }

  console.log('🟠🟠🟠 AppSessionManager: ❌ User is NOT authenticated - but this component should NOT be used in header');
  console.log('🟠🟠🟠 AppSessionManager: WARNING - This component should not be rendered in header when SaveProgressSection exists');
  
  // Return null to prevent any rendering - SaveProgressSection should handle this
  return null;
};

export default AppSessionManager;
