
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LinkGoogleButtonProps {
  isVisible: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onClose?: () => void;
}

export const LinkGoogleButton: React.FC<LinkGoogleButtonProps> = ({
  isVisible,
  isLoading,
  setIsLoading,
  onClose
}) => {
  const handleLinkGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) {
        toast({
          title: 'Failed to link Google account',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        onClose?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <div className="text-sm text-gray-600 mb-3">
        You'll be redirected to Google to complete the linking process.
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleLinkGoogle}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Link Google Account
        </Button>
      </div>
    </div>
  );
};
