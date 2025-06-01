
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
}

export const LinkEmailForm: React.FC<LinkEmailFormProps> = ({
  isVisible,
  isLoading,
  setIsLoading
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        password: password,
      });

      if (error) {
        toast({
          title: 'Failed to link email',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email linked successfully',
          description: 'Please check your email to verify the new address',
        });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4" />
        <span className="font-medium">Link Email & Password</span>
      </div>
      <form onSubmit={handleLinkEmail} className="space-y-3">
        <div>
          <Label htmlFor="link-email">Email Address</Label>
          <Input
            id="link-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="link-password">Password</Label>
          <Input
            id="link-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Link Email & Password
        </Button>
      </form>
    </div>
  );
};
