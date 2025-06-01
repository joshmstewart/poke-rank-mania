
import { useState } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
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
    console.log('📱 [PHONE_AUTH_DEBUG] ===== PHONE SUBMIT START =====');
    console.log('📱 [PHONE_AUTH_DEBUG] Input phone number:', phoneNumber);
    
    setIsLoading(true);
    
    try {
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone.replace(/\D/g, '');
      }
      
      console.log('📱 [PHONE_AUTH_DEBUG] Formatted phone:', formattedPhone);
      console.log('📱 [PHONE_AUTH_DEBUG] About to call signInWithPhone...');
      
      const { error } = await signInWithPhone(formattedPhone);
      
      console.log('📱 [PHONE_AUTH_DEBUG] signInWithPhone result:', { error: error?.message });
      
      if (error) {
        console.error('📱 [PHONE_AUTH_DEBUG] Phone auth error:', error);
        toast({
          title: 'Phone Authentication Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('📱 [PHONE_AUTH_DEBUG] ✅ OTP sent successfully');
        toast({
          title: 'OTP Sent!',
          description: 'Please check your phone for the verification code.',
        });
        onSuccess(formattedPhone);
      }
    } catch (exception) {
      console.error('📱 [PHONE_AUTH_DEBUG] Exception in handlePhoneSubmit:', exception);
      toast({
        title: 'Phone Authentication Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('📱 [PHONE_AUTH_DEBUG] ===== PHONE SUBMIT END =====');
    }
  };

  const handleOtpVerification = async (
    phoneNumber: string,
    otp: string,
    onSuccess: () => void
  ) => {
    console.log('📱 [OTP_VERIFY_DEBUG] ===== OTP VERIFICATION START =====');
    console.log('📱 [OTP_VERIFY_DEBUG] Phone:', phoneNumber);
    console.log('📱 [OTP_VERIFY_DEBUG] OTP length:', otp.length);
    
    setIsLoading(true);
    
    try {
      const { error } = await verifyPhoneOtp(phoneNumber, otp);
      
      console.log('📱 [OTP_VERIFY_DEBUG] Verification result:', { error: error?.message });
      
      if (error) {
        console.error('📱 [OTP_VERIFY_DEBUG] OTP verification error:', error);
        toast({
          title: 'OTP Verification Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('📱 [OTP_VERIFY_DEBUG] ✅ OTP verification successful');
        toast({
          title: 'Welcome!',
          description: 'Successfully signed in with your phone number.',
        });
        onSuccess();
      }
    } catch (exception) {
      console.error('📱 [OTP_VERIFY_DEBUG] Exception in handleOtpVerification:', exception);
      toast({
        title: 'Verification Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('📱 [OTP_VERIFY_DEBUG] ===== OTP VERIFICATION END =====');
    }
  };

  const handleResendOtp = async (phoneNumber: string) => {
    console.log('📱 [RESEND_OTP_DEBUG] ===== RESEND OTP START =====');
    console.log('📱 [RESEND_OTP_DEBUG] Phone:', phoneNumber);
    
    setIsLoading(true);
    
    try {
      const { error } = await signInWithPhone(phoneNumber);
      
      console.log('📱 [RESEND_OTP_DEBUG] Resend result:', { error: error?.message });
      
      if (error) {
        console.error('📱 [RESEND_OTP_DEBUG] Resend error:', error);
        toast({
          title: 'Resend Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('📱 [RESEND_OTP_DEBUG] ✅ OTP resent successfully');
        toast({
          title: 'OTP Resent!',
          description: 'Please check your phone for the new verification code.',
        });
      }
    } catch (exception) {
      console.error('📱 [RESEND_OTP_DEBUG] Exception in handleResendOtp:', exception);
      toast({
        title: 'Resend Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('📱 [RESEND_OTP_DEBUG] ===== RESEND OTP END =====');
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔍 [GOOGLE_AUTH_DEBUG] ===== GOOGLE SIGN IN START =====');
    
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      console.log('🔍 [GOOGLE_AUTH_DEBUG] Google sign in result:', { error: error?.message });
      
      if (error) {
        console.error('🔍 [GOOGLE_AUTH_DEBUG] Google sign in error:', error);
        toast({
          title: 'Google Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (exception) {
      console.error('🔍 [GOOGLE_AUTH_DEBUG] Exception in handleGoogleSignIn:', exception);
      toast({
        title: 'Google Sign In Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('🔍 [GOOGLE_AUTH_DEBUG] ===== GOOGLE SIGN IN END =====');
    }
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
