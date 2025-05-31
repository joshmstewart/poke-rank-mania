
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('SaveProgressSection render:', { user: !!user, loading, userId: user?.id });

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  if (user) {
    console.log('Rendering AuthenticatedUserDisplay for user:', user.email);
    // Show authenticated user display when logged in
    return <AuthenticatedUserDisplay />;
  }

  console.log('Rendering CloudSyncButton - no user found');
  // Show cloud sync button when not logged in
  return <CloudSyncButton />;
};

export default SaveProgressSection;
