
import React from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import type { User, Session } from '@supabase/supabase-js';

const getDisplayIdentifier = (user: User | null, session: Session | null): string => {
  const currentUser = user || session?.user;

  if (!currentUser) {
    return 'No Details';
  }

  const displayName = currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name;
  if (displayName) return displayName;
  
  if (currentUser.email) return currentUser.email;
  
  if (currentUser.phone) return currentUser.phone;

  return 'Authenticated';
};

export const AuthStatusIndicator: React.FC = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return <div className="text-xs text-gray-500 px-2">Auth: Loading...</div>;
  }

  const hasSession = !!session;
  const hasUser = !!user;

  let statusText = 'Unauthenticated';
  let bgColor = 'bg-yellow-100 border-yellow-300';
  let detailsText = 'No session or user';

  if (hasSession && hasUser) {
    statusText = 'Authenticated';
    bgColor = 'bg-green-100 border-green-300';
    detailsText = getDisplayIdentifier(user, session);
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
