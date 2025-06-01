
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const unlinkIdentity = async (provider: string) => {
  try {
    // First get the user's identities to find the correct one to unlink
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !currentUser) {
      toast({
        title: 'Failed to get user data',
        description: userError?.message || 'Unable to get user information',
        variant: 'destructive',
      });
      return;
    }

    // Find the identity for the specified provider
    const identity = currentUser.identities?.find(id => id.provider === provider);
    
    if (!identity) {
      toast({
        title: 'Identity not found',
        description: `No ${provider} identity found to unlink`,
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);

    if (error) {
      toast({
        title: 'Failed to unlink account',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account unlinked',
        description: `Successfully unlinked ${provider} account`,
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'An unexpected error occurred',
      variant: 'destructive',
    });
  }
};
