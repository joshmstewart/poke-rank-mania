
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    // Show authenticated user display when logged in
    return <AuthenticatedUserDisplay />;
  }

  // Show cloud sync button when not logged in
  return <CloudSyncButton />;
};

export default SaveProgressSection;
