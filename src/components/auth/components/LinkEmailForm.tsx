
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LinkEmailFormProps {
  isVisible: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onClose?: () => void;
}

export const LinkEmailForm: React.FC<LinkEmailFormProps> = ({
  isVisible,
  isLoading,
  setIsLoading,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing information',
        description: 'Please provide both email and password',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔗 [LINK_EMAIL] Starting email linking process...');
      
      // First, try to update the user's email
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });

      if (emailError) {
        console.error('🔗 [LINK_EMAIL] Email update error:', emailError);
        toast({
          title: 'Failed to link email',
          description: emailError.message,
          variant: 'destructive',
        });
        return;
      }

      // Then update the password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) {
        console.error('🔗 [LINK_EMAIL] Password update error:', passwordError);
        toast({
          title: 'Email linked but password update failed',
          description: passwordError.message,
          variant: 'destructive',
        });
      } else {
        console.log('🔗 [LINK_EMAIL] ✅ Successfully linked email and password');
        toast({
          title: 'Email and password linked successfully',
          description: 'Please check your email to verify the new address. You can now sign in with email and password.',
        });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        onClose?.();
      }
    } catch (error: any) {
      console.error('🔗 [LINK_EMAIL] Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while linking your email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
      <div className="mb-3">
        <h4 className="font-medium text-sm">Add Email & Password</h4>
        <p className="text-xs text-muted-foreground">
          This will allow you to sign in with email and password in addition to your current method.
        </p>
      </div>
      
      <form onSubmit={handleLinkEmail} className="space-y-3">
        <div>
          <Label htmlFor="link-email">Email Address</Label>
          <Input
            id="link-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="link-password">New Password</Label>
          <Input
            id="link-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Mail className="mr-2 h-4 w-4" />
            Link Email & Password
          </Button>
        </div>
      </form>
    </div>
  );
};
