
import React from 'react';
import { useAuth } from '@/contexts/auth/useAuth';

export const AuthStatusIndicator: React.FC = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return <div className="text-xs text-gray-500 px-2">Auth: Loading...</div>;
  }

  const hasSession = !!session;
  const hasUser = !!user;
  const displayEmail = user?.email || session?.user?.email || 'No Email';

  let statusText = 'Unauthenticated';
  let bgColor = 'bg-yellow-100 border-yellow-300';
  let detailsText = 'No session or user';

  if (hasSession && hasUser) {
    statusText = 'Authenticated';
    bgColor = 'bg-green-100 border-green-300';
    detailsText = displayEmail;
  } else if (hasSession && !hasUser) {
    statusText = 'Incomplete Auth';
    bgColor = 'bg-red-100 border-red-300';
    detailsText = 'Session OK, User missing';
  } else if (!hasSession && hasUser) {
    // This case should not happen, but good to handle
    statusText = 'Auth Anomaly';
    bgColor = 'bg-purple-100 border-purple-300';
    detailsText = 'User OK, Session missing';
  }

  return (
    <div className={`text-xs p-2 border rounded-md mr-4 ${bgColor}`}>
      <div className="font-bold">{statusText}</div>
      <div className="font-mono truncate max-w-[150px]">{detailsText}</div>
    </div>
  );
};
