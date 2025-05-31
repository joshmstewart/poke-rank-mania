
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const AuthenticatedUserDisplay: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {user.user_metadata?.display_name || user.email || user.phone}
      </span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Sign Out</span>
      </Button>
    </div>
  );
};
