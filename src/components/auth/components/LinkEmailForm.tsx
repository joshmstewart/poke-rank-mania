
import React, { useState, useEffect } from 'react';
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

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Real-time validation
  useEffect(() => {
    const errors: ValidationErrors = {};

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (password && password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (confirmPassword && password && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
  }, [email, password, confirmPassword]);

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔗 [LINK_EMAIL] Form submitted with:', { email, password: '***', confirmPassword: '***' });
    
    if (!email || !password) {
      console.log('🔗 [LINK_EMAIL] Missing email or password');
      toast({
        title: 'Missing information',
        description: 'Please provide both email and password',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      console.log('🔗 [LINK_EMAIL] Passwords do not match');
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      console.log('🔗 [LINK_EMAIL] Password too short');
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      console.log('🔗 [LINK_EMAIL] Validation errors present:', validationErrors);
      toast({
        title: 'Please fix validation errors',
        description: 'Check the form for any errors before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('🔗 [LINK_EMAIL] Starting email linking process...');
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('🔗 [LINK_EMAIL] No authenticated user found:', userError);
        toast({
          title: 'Authentication error',
          description: 'You must be logged in to link an email',
          variant: 'destructive',
        });
        return;
      }

      console.log('🔗 [LINK_EMAIL] Current user:', { id: user.id, email: user.email, phone: user.phone });

      // For phone-authenticated users, we need to add email as a new identity
      if (user.phone && !user.email) {
        console.log('🔗 [LINK_EMAIL] Phone user adding email - updating user email and password');
        
        // Update user email - this will send a confirmation email
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });

        if (emailError) {
          console.error('🔗 [LINK_EMAIL] Email update error:', emailError);
          
          if (emailError.message?.includes('email_exists') || emailError.message?.includes('already been registered')) {
            toast({
              title: 'Email already in use',
              description: 'This email is already associated with another account. Please use a different email.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Failed to link email',
              description: emailError.message || 'An error occurred while linking your email',
              variant: 'destructive',
            });
          }
          return;
        }

        // Update password separately
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
        });

        if (passwordError) {
          console.error('🔗 [LINK_EMAIL] Password update error:', passwordError);
          toast({
            title: 'Email linked but password update failed',
            description: passwordError.message || 'Password could not be set',
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
      } else {
        console.log('🔗 [LINK_EMAIL] User already has email, updating email and password');
        
        // User already has email, just update it
        const { error: updateError } = await supabase.auth.updateUser({
          email: email,
          password: password,
        });

        if (updateError) {
          console.error('🔗 [LINK_EMAIL] Update error:', updateError);
          
          if (updateError.message?.includes('email_exists') || updateError.message?.includes('already been registered')) {
            toast({
              title: 'Email already in use',
              description: 'This email is already associated with another account. Please use a different email.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Failed to update email and password',
              description: updateError.message || 'An error occurred while updating your credentials',
              variant: 'destructive',
            });
          }
        } else {
          console.log('🔗 [LINK_EMAIL] ✅ Successfully updated email and password');
          toast({
            title: 'Email and password updated successfully',
            description: 'Please check your email to verify the new address.',
          });
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          onClose?.();
        }
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
            className={validationErrors.email ? 'border-red-500' : ''}
            required
          />
          {validationErrors.email && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="link-password">New Password</Label>
          <Input
            id="link-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className={validationErrors.password ? 'border-red-500' : ''}
            required
            minLength={6}
          />
          {validationErrors.password && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className={validationErrors.confirmPassword ? 'border-red-500' : ''}
            required
          />
          {validationErrors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !email.trim() || !password.trim() || !confirmPassword.trim() || Object.keys(validationErrors).length > 0} 
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Mail className="mr-2 h-4 w-4" />
            Link Email & Password
          </Button>
        </div>
      </form>
    </div>
  );
};
