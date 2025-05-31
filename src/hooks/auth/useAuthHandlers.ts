
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useAuthHandlers = () => {
  const { signIn, signUp, signInWithGoogle, signInWithPhone, verifyPhoneOtp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (
    email: string, 
    password: string, 
    displayName: string, 
    isSignUp: boolean,
    onSuccess: () => void,
    onToggleSignUp: () => void
  ) => {
    setIsLoading(true);
    
    let result;
    if (isSignUp) {
      result = await signUp(email, password, displayName);
    } else {
      result = await signIn(email, password);
    }
    
    if (result.error) {
      if (!isSignUp && result.error.message?.includes('Invalid login credentials')) {
        toast({
          title: 'Account not found',
          description: 'Would you like to create a new account with this email?',
          variant: 'destructive',
        });
        onToggleSignUp();
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
      onSuccess();
    }
    setIsLoading(false);
  };

  const handlePhoneSubmit = async (
    phoneNumber: string,
    onSuccess: (formattedPhone: string) => void
  ) => {
    setIsLoading(true);
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
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
      onSuccess(formattedPhone);
    }
    setIsLoading(false);
  };

  const handleOtpVerification = async (
    phoneNumber: string,
    otp: string,
    onSuccess: () => void
  ) => {
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
      onSuccess();
    }
    setIsLoading(false);
  };

  const handleResendOtp = async (phoneNumber: string) => {
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

  return {
    isLoading,
    handleEmailAuth,
    handlePhoneSubmit,
    handleOtpVerification,
    handleResendOtp,
    handleGoogleSignIn,
  };
};
