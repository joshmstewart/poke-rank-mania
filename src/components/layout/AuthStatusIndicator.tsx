
import React from 'react';
import { useAuth } from '@/contexts/auth/useAuth';

export const AuthStatusIndicator: React.FC = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return <div className="text-xs text-gray-500 px-2">Auth: Loading...</div>;
  }

  const authState = user || session?.user ? 'Authenticated' : 'Unauthenticated';
  const displayUser = user?.email || session?.user?.email || 'No User';
  const indicatorColor = authState === 'Authenticated' ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300';

  return (
    <div className={`text-xs p-2 border rounded-md mr-4 ${indicatorColor}`}>
      <div className="font-bold">{authState}</div>
      <div className="font-mono truncate max-w-[150px]">{displayUser}</div>
    </div>
  );
};
