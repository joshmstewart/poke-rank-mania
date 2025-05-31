
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const AppSessionManager = () => {
  const { user } = useAuth();

  console.log('🟠 AppSessionManager: Component called - user authenticated:', !!user);

  // This component is deprecated in favor of SaveProgressSection
  // Return null to prevent any rendering conflicts
  return null;
};

export default AppSessionManager;
