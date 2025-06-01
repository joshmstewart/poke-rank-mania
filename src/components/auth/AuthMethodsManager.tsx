
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Phone, Link as LinkIcon, Unlink } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const AuthMethodsManager: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check what auth methods are currently linked
  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phone;
  const hasGoogle = user?.app_metadata?.providers?.includes('google');

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

  const handleUnlinkIdentity = async (provider: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Authentication Methods
        </CardTitle>
        <CardDescription>
          Manage how you sign in to your account. You can link multiple authentication methods for easier access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Methods */}
        <div>
          <h4 className="text-sm font-medium mb-3">Currently Linked</h4>
          <div className="space-y-2">
            {hasEmail && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Email: {user?.email}</span>
                </div>
              </div>
            )}
            {hasPhone && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Phone: {user?.phone}</span>
                </div>
              </div>
            )}
            {hasGoogle && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm">Google Account</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlinkIdentity('google')}
                  disabled={isLoading}
                >
                  <Unlink className="h-3 w-3 mr-1" />
                  Unlink
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Add New Methods */}
        <div>
          <h4 className="text-sm font-medium mb-3">Add Authentication Methods</h4>
          
          {/* Link Email/Password */}
          {!hasEmail && (
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
          )}

          {/* Link Google */}
          {!hasGoogle && (
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">Link Google Account</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLinkGoogle}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Link Google
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
