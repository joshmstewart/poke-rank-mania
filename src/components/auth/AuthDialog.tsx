
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, LogOut, Phone, ArrowLeft, Mail } from 'lucide-react';

interface AuthDialogProps {
  children: React.ReactNode;
}

type AuthView = 'methods' | 'phone-input' | 'phone-otp';

export const AuthDialog: React.FC<AuthDialogProps> = ({ children }) => {
  const { user, signIn, signUp, signOut, signInWithGoogle, signInWithPhone, verifyPhoneOtp, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>('methods');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    let result;
    if (isSignUp) {
      result = await signUp(email, password, displayName);
    } else {
      result = await signIn(email, password);
    }
    
    if (result.error) {
      // If sign in fails, try sign up for new users
      if (!isSignUp && result.error.message?.includes('Invalid login credentials')) {
        toast({
          title: 'Account not found',
          description: 'Would you like to create a new account with this email?',
          variant: 'destructive',
        });
        setIsSignUp(true);
      } else {
        toast({
          title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
          description: result.error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: isSignUp ? 'Account created!' : 'Welcome back!',
        description: isSignUp ? 'Please check your email to verify your account.' : 'Successfully signed in.',
      });
      setIsOpen(false);
      resetForm();
    }
    setIsLoading(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Ensure phone number is in international format
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      // Default to US if no country code provided
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '');
    }
    
    const { error } = await signInWithPhone(formattedPhone);
    
    if (error) {
      toast({
        title: 'Phone Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'OTP Sent!',
        description: 'Please check your phone for the verification code.',
      });
      setPhoneNumber(formattedPhone);
      setCurrentView('phone-otp');
    }
    setIsLoading(false);
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await verifyPhoneOtp(phoneNumber, otp);
    
    if (error) {
      toast({
        title: 'OTP Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome!',
        description: 'Successfully signed in with your phone number.',
      });
      setIsOpen(false);
      resetForm();
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    const { error } = await signInWithPhone(phoneNumber);
    
    if (error) {
      toast({
        title: 'Resend Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'OTP Resent!',
        description: 'Please check your phone for the new verification code.',
      });
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: 'Google Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setPhoneNumber('');
    setOtp('');
    setCurrentView('methods');
    setIsSignUp(false);
  };

  const handleBackToMethods = () => {
    setCurrentView('methods');
    setOtp('');
  };

  const handleBackToPhone = () => {
    setCurrentView('phone-input');
    setOtp('');
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (user) {
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
  }

  const renderMethodsView = () => (
    <>
      {/* Email/Password Section */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name (Optional)</Label>
            <Input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your trainer name"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Mail className="mr-2 h-4 w-4" />
          Continue with Email
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>
      </form>

      {/* Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Alternative Methods */}
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => setCurrentView('phone-input')}
          disabled={isLoading}
        >
          <Phone className="mr-2 h-4 w-4" />
          Continue with Phone
        </Button>
      </div>
    </>
  );

  const renderPhoneInputView = () => (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBackToMethods}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Sign in with phone number
        </span>
      </div>

      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-number">Phone Number</Label>
          <Input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />
          <p className="text-xs text-muted-foreground">
            Include your country code (e.g., +1 for US/Canada)
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send OTP
        </Button>
      </form>
    </>
  );

  const renderPhoneOtpView = () => (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBackToPhone}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Enter code sent to {phoneNumber}
        </span>
      </div>
      
      <form onSubmit={handleOtpVerification} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification Code</Label>
          <Input
            id="otp-code"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify OTP & Continue
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendOtp}
          disabled={isLoading}
        >
          Resend OTP
        </Button>
      </form>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Save Your Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {currentView === 'methods' && renderMethodsView()}
          {currentView === 'phone-input' && renderPhoneInputView()}
          {currentView === 'phone-otp' && renderPhoneOtpView()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
